import { afterAll, expect, test } from 'vitest'

import { getTableRowsCountSql } from '../../../src'
import { cleanupRoot, createTestDatabase } from '../../db/utils'

afterAll(async () => {
  await cleanupRoot()
})

const withTestDatabase = (
  name: string,
  fn: (db: Awaited<ReturnType<typeof createTestDatabase>>) => Promise<void>
) => {
  test(name, async () => {
    const db = await createTestDatabase()
    try {
      await fn(db)
    } finally {
      await db.cleanup()
    }
  })
}

const oidOf = async (
  db: Awaited<ReturnType<typeof createTestDatabase>>,
  qualified: string
): Promise<number> => {
  const [{ id }] = await db.executeQuery<{ id: number }[]>(
    `select '${qualified}'::regclass::oid::int8 as id;`
  )
  return Number(id)
}

// A large, freshly bulk-loaded, NEVER-analyzed table: pg_class.reltuples stays
// -1 until the first (auto)analyze. autovacuum is disabled so reltuples cannot
// flip mid-test. This is the case the legacy path mishandles (it treats -1 as
// "small" and runs an exact count(*) that can time out at multi-million scale).
const BULK_ROWS = 100_000

withTestDatabase(
  'scoped: unanalyzed bulk table returns an estimate (is_estimate=true), never the raw -1',
  async (db) => {
    await db.executeQuery(`
      create table public.bulk_unanalyzed (id int primary key, val text)
        with (autovacuum_enabled = false);
      insert into public.bulk_unanalyzed
        select g, 'row-' || g from generate_series(1, ${BULK_ROWS}) g;
    `)

    // Guard: the table is genuinely never-analyzed (reltuples = -1).
    const [{ reltuples }] = await db.executeQuery<{ reltuples: number }[]>(
      `select reltuples::int8 as reltuples from pg_class where oid = 'public.bulk_unanalyzed'::regclass;`
    )
    expect(Number(reltuples)).toBe(-1)

    const table = { id: await oidOf(db, 'public.bulk_unanalyzed'), name: 'bulk_unanalyzed', schema: 'public' }

    // Non-readonly scoped: uses the EXPLAIN-based estimate (works via relpages
    // without ANALYZE). Must be an estimate, and clearly not the raw -1.
    const [scoped] = await db.executeQuery<Array<{ count: number; is_estimate: boolean }>>(
      getTableRowsCountSql({ table, scoped: true })
    )
    expect(scoped.is_estimate).toBe(true)
    expect(Number(scoped.count)).toBeGreaterThan(1000)

    // Readonly scoped: cannot create the estimate function, reports -1 as an
    // estimate rather than running an exact count.
    const [scopedReadonly] = await db.executeQuery<
      Array<{ count: number; is_estimate: boolean }>
    >(getTableRowsCountSql({ table, scoped: true, isReadOnlyContext: true }))
    expect(scopedReadonly.is_estimate).toBe(true)
    expect(Number(scopedReadonly.count)).toBe(-1)

    // Legacy (scoped:false) still mishandles -1 by running an exact count -- it
    // returns the true count with is_estimate=false. Documents the pre-fix
    // behavior the scoped path corrects.
    const [legacy] = await db.executeQuery<Array<{ count: number; is_estimate: boolean }>>(
      getTableRowsCountSql({ table })
    )
    expect(legacy.is_estimate).toBe(false)
    expect(Number(legacy.count)).toBe(BULK_ROWS)
  }
)

withTestDatabase(
  'scoped: small analyzed table still returns the exact count (is_estimate=false)',
  async (db) => {
    await db.executeQuery(`
      create table public.small_analyzed (id int primary key);
      insert into public.small_analyzed select generate_series(1, 5);
      analyze public.small_analyzed;
    `)
    const table = { id: await oidOf(db, 'public.small_analyzed'), name: 'small_analyzed', schema: 'public' }

    const [scoped] = await db.executeQuery<Array<{ count: number; is_estimate: boolean }>>(
      getTableRowsCountSql({ table, scoped: true })
    )
    expect(scoped.is_estimate).toBe(false)
    expect(Number(scoped.count)).toBe(5)

    // Readonly scoped on a small analyzed table also returns the exact count.
    const [scopedReadonly] = await db.executeQuery<
      Array<{ count: number; is_estimate: boolean }>
    >(getTableRowsCountSql({ table, scoped: true, isReadOnlyContext: true }))
    expect(scopedReadonly.is_estimate).toBe(false)
    expect(Number(scopedReadonly.count)).toBe(5)
  }
)
