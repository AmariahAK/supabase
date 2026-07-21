import { afterAll, expect, test } from 'vitest'

import { getTableRowsCountSql } from '../../../src'
import { cleanupRoot, createTestDatabase } from '../../db/utils'

type Db = Awaited<ReturnType<typeof createTestDatabase>>
type CountRow = { count: number; is_estimate: boolean }

afterAll(async () => {
  await cleanupRoot()
})

const withTestDatabase = (name: string, fn: (db: Db) => Promise<void>) => {
  test(name, async () => {
    const db = await createTestDatabase()
    try {
      await fn(db)
    } finally {
      await db.cleanup()
    }
  })
}

const tableOf = async (db: Db, qualified: string, name: string, schema: string) => {
  const [{ id }] = await db.executeQuery<{ id: number }[]>(
    `select '${qualified}'::regclass::oid::int8 as id;`
  )
  return { id: Number(id), name, schema }
}

const reltuplesOf = async (db: Db, qualified: string) => {
  const [{ reltuples }] = await db.executeQuery<{ reltuples: number }[]>(
    `select reltuples::int8 as reltuples from pg_class where oid = '${qualified}'::regclass;`
  )
  return Number(reltuples)
}

const runCount = async (db: Db, args: Parameters<typeof getTableRowsCountSql>[0]) => {
  const [row] = await db.executeQuery<CountRow[]>(getTableRowsCountSql(args))
  return { count: Number(row.count), is_estimate: row.is_estimate }
}

// A never-analyzed table has pg_class.reltuples = -1 -- true for a brand-new
// EMPTY table, a small one, AND a freshly bulk-loaded huge one. autovacuum is
// disabled on every fixture so reltuples cannot flip mid-test.

withTestDatabase(
  'scoped: empty never-analyzed table -> exact count 0, is_estimate=false (both modes)',
  async (db) => {
    await db.executeQuery(
      `create table public.empty_t (id int primary key) with (autovacuum_enabled = false);`
    )
    expect(await reltuplesOf(db, 'public.empty_t')).toBe(-1)
    const table = await tableOf(db, 'public.empty_t', 'empty_t', 'public')

    // Postgres estimates a never-vacuumed heap at a ~10-page minimum, so a naive
    // reltuples=-1 -> estimate would report phantom rows here. The size gate
    // routes an empty (0-byte) heap to an exact count instead.
    expect(await runCount(db, { table, scoped: true })).toEqual({ count: 0, is_estimate: false })
    expect(await runCount(db, { table, scoped: true, isReadOnlyContext: true })).toEqual({
      count: 0,
      is_estimate: false,
    })
  }
)

withTestDatabase(
  'scoped: small never-analyzed table -> exact count, is_estimate=false (both modes)',
  async (db) => {
    await db.executeQuery(`
      create table public.small_unanalyzed (id int primary key, val text)
        with (autovacuum_enabled = false);
      insert into public.small_unanalyzed select g, 'r' || g from generate_series(1, 1000) g;
    `)
    expect(await reltuplesOf(db, 'public.small_unanalyzed')).toBe(-1)
    const table = await tableOf(db, 'public.small_unanalyzed', 'small_unanalyzed', 'public')

    // Heap is a few tens of KB -- well under the byte gate -> exact count.
    expect(await runCount(db, { table, scoped: true })).toEqual({ count: 1000, is_estimate: false })
    expect(await runCount(db, { table, scoped: true, isReadOnlyContext: true })).toEqual({
      count: 1000,
      is_estimate: false,
    })
  }
)

withTestDatabase(
  'scoped: large never-analyzed table (heap over byte gate) -> estimate, is_estimate=true',
  async (db) => {
    // Wide rows (~300-byte payload) so the heap clears the ~10MB byte gate with a
    // modest, fast-to-insert row count (~19MB at 60k rows) -- the case the legacy
    // path mishandles (treats reltuples=-1 as small, runs a timing-out count).
    await db.executeQuery(`
      create table public.bulk_unanalyzed (id int primary key, val text)
        with (autovacuum_enabled = false);
      insert into public.bulk_unanalyzed
        select g, repeat('x', 300) from generate_series(1, 60000) g;
    `)
    expect(await reltuplesOf(db, 'public.bulk_unanalyzed')).toBe(-1)
    const [{ bytes }] = await db.executeQuery<{ bytes: number }[]>(
      `select pg_relation_size('public.bulk_unanalyzed'::regclass)::int8 as bytes;`
    )
    expect(Number(bytes)).toBeGreaterThan(10_000_000)
    const table = await tableOf(db, 'public.bulk_unanalyzed', 'bulk_unanalyzed', 'public')

    // Non-readonly scoped: EXPLAIN-based estimate (works without ANALYZE).
    const scoped = await runCount(db, { table, scoped: true })
    expect(scoped.is_estimate).toBe(true)
    expect(scoped.count).toBeGreaterThan(1000)
    expect(scoped.count).not.toBe(-1)

    // Readonly scoped: cannot create the estimate function -> reports -1 as an
    // estimate rather than a timing-out exact count.
    expect(await runCount(db, { table, scoped: true, isReadOnlyContext: true })).toEqual({
      count: -1,
      is_estimate: true,
    })

    // Legacy (scoped:false) still runs an exact count on the -1 table.
    expect(await runCount(db, { table })).toEqual({ count: 60000, is_estimate: false })
  }
)

withTestDatabase(
  'scoped: small analyzed table -> exact count, is_estimate=false',
  async (db) => {
    await db.executeQuery(`
      create table public.small_analyzed (id int primary key);
      insert into public.small_analyzed select generate_series(1, 5);
      analyze public.small_analyzed;
    `)
    const table = await tableOf(db, 'public.small_analyzed', 'small_analyzed', 'public')

    expect(await runCount(db, { table, scoped: true })).toEqual({ count: 5, is_estimate: false })
    expect(await runCount(db, { table, scoped: true, isReadOnlyContext: true })).toEqual({
      count: 5,
      is_estimate: false,
    })
  }
)

withTestDatabase(
  'scoped: analyzed table over THRESHOLD_COUNT -> estimate, is_estimate=true (unchanged)',
  async (db) => {
    // reltuples > 50000 after analyze routes to the estimate branch regardless of
    // heap size -- this behavior is unchanged by the byte-gate fix.
    await db.executeQuery(`
      create table public.big_analyzed (id int primary key)
        with (autovacuum_enabled = false);
      insert into public.big_analyzed select generate_series(1, 60000);
      analyze public.big_analyzed;
    `)
    expect(await reltuplesOf(db, 'public.big_analyzed')).toBeGreaterThan(50000)
    const table = await tableOf(db, 'public.big_analyzed', 'big_analyzed', 'public')

    // Non-readonly, no filters: returns the raw reltuples estimate.
    const scoped = await runCount(db, { table, scoped: true })
    expect(scoped.is_estimate).toBe(true)
    expect(scoped.count).toBeGreaterThan(1000)

    // Readonly: reports -1 as an estimate.
    expect(await runCount(db, { table, scoped: true, isReadOnlyContext: true })).toEqual({
      count: -1,
      is_estimate: true,
    })
  }
)
