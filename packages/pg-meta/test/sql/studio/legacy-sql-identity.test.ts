import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

import { expect, test } from 'vitest'

import { getTableRowsCountSql } from '../../../src'
import tablePrivileges from '../../../src/pg-meta-table-privileges'
import * as types from '../../../src/pg-meta-types'
import type { Filter } from '../../../src/query'

/**
 * Legacy byte-identity guard.
 *
 * The `scoped` introspection optimizations (PR #47894 follow-up) keep the
 * scoped:false rendering of every touched SQL builder BYTE-IDENTICAL to the
 * pre-change query, so the optimization can ship dark behind a feature flag
 * without risking the default (legacy) path.
 *
 * Each expected string below is a snapshot of the rendered legacy SQL captured
 * from origin/master (see test/fixtures/legacy-sql/*.sql). If a change alters
 * the default rendering, the corresponding assertion fails -- forcing an
 * explicit, reviewed fixture update rather than silent drift. Regenerate a
 * fixture ONLY after confirming the change to the default path is intentional.
 */

const here = dirname(fileURLToPath(import.meta.url))
const fixture = (name: string): string =>
  readFileSync(join(here, '../../fixtures/legacy-sql', name), 'utf8')

const ROWS_TABLE = { id: 424242, name: 'my_table', schema: 'public' }
const STATUS_FILTER: Filter[] = [{ column: 'status', operator: '=', value: 'active' }]

test('types.list legacy rendering is byte-identical (scoped:false)', () => {
  expect(String(types.list().sql)).toBe(fixture('types-list-default.sql'))
  expect(String(types.list({ includedSchemas: ['public', 'auth'] }).sql)).toBe(
    fixture('types-list-included.sql')
  )
  expect(String(types.list({ includeArrayTypes: true }).sql)).toBe(
    fixture('types-list-arraytypes.sql')
  )
  expect(
    String(types.list({ excludedSchemas: ['public'], includeSystemSchemas: true }).sql)
  ).toBe(fixture('types-list-excluded-sys.sql'))
  expect(String(types.list({ limit: 10, offset: 5 }).sql)).toBe(
    fixture('types-list-limit-offset.sql')
  )
})

test('tablePrivileges.list/retrieve legacy rendering is byte-identical (scoped:false)', () => {
  expect(String(tablePrivileges.list().sql)).toBe(fixture('tablepriv-list-default.sql'))
  expect(String(tablePrivileges.list({ includedSchemas: ['public'] }).sql)).toBe(
    fixture('tablepriv-list-included.sql')
  )
  expect(String(tablePrivileges.list({ limit: 3, offset: 2 }).sql)).toBe(
    fixture('tablepriv-list-limit-offset.sql')
  )
  expect(String(tablePrivileges.retrieve({ id: 12345 }).sql)).toBe(
    fixture('tablepriv-retrieve-id.sql')
  )
  expect(String(tablePrivileges.retrieve({ name: 'todos', schema: 'public' }).sql)).toBe(
    fixture('tablepriv-retrieve-name.sql')
  )
})

test('getTableRowsCountSql legacy rendering is byte-identical (scoped:false)', () => {
  expect(
    String(getTableRowsCountSql({ table: ROWS_TABLE, enforceExactCount: true }))
  ).toBe(fixture('rows-exact.sql'))
  expect(
    String(
      getTableRowsCountSql({ table: ROWS_TABLE, enforceExactCount: true, filters: STATUS_FILTER })
    )
  ).toBe(fixture('rows-exact-filter.sql'))
  expect(String(getTableRowsCountSql({ table: ROWS_TABLE }))).toBe(
    fixture('rows-nonreadonly-nofilter.sql')
  )
  expect(String(getTableRowsCountSql({ table: ROWS_TABLE, filters: STATUS_FILTER }))).toBe(
    fixture('rows-nonreadonly-filter.sql')
  )
  expect(String(getTableRowsCountSql({ table: ROWS_TABLE, isReadOnlyContext: true }))).toBe(
    fixture('rows-readonly-nofilter.sql')
  )
  expect(
    String(
      getTableRowsCountSql({ table: ROWS_TABLE, isReadOnlyContext: true, filters: STATUS_FILTER })
    )
  ).toBe(fixture('rows-readonly-filter.sql'))
})
