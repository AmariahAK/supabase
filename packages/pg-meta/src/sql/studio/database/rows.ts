import { literal, safeSql, type SafeSqlFragment } from '../../../pg-format'
import { Filter, Query } from '../../../query'
import { COUNT_ESTIMATE_SQL, THRESHOLD_COUNT } from './get-count-estimate'

/**
 * [Joshen] Initially check reltuples from pg_class for an estimate of row count on the table
 * - If reltuples = -1, table never been analyzed, assume small table -> return exact count
 * - If reltuples exceeds threshold, return estimate count
 * - Else return exact count
 *
 * The `reltuples = -1` assumption above is a latent bug on large, freshly
 * bulk-loaded (never-analyzed) tables: pg_class.reltuples is -1 until the first
 * ANALYZE, so the legacy path runs an exact `count(*)` and can hit a statement
 * timeout on a multi-million-row table. The opt-in `scoped` path fixes this by
 * treating `estimate = -1` the same as "over threshold": it never returns the
 * raw -1 as a count and instead uses the EXPLAIN-based estimate (which works on
 * an unanalyzed table via relpages) in the non-readonly context, or reports -1
 * with is_estimate=true in the readonly context (where it cannot create the
 * pg_temp estimate function). `scoped` defaults to false so the behavior can be
 * rolled out behind a feature flag; the scoped=false rendering stays
 * byte-identical to the current query.
 */
export const getTableRowsCountSql = ({
  table,
  filters = [],
  enforceExactCount = false,
  isReadOnlyContext = false,
  scoped = false,
}: {
  table: any
  filters?: Filter[]
  enforceExactCount?: boolean
  /** Skips using the count estimate function if true and fallsback to checking reltuples from pg_class  */
  isReadOnlyContext?: boolean
  /**
   * Opt-in optimized counting: also treats a never-analyzed table
   * (reltuples = -1) as "estimate" so a large bulk-loaded table never runs an
   * exact count(*) that could time out. Defaults to false (legacy behavior).
   */
  scoped?: boolean
}): SafeSqlFragment => {
  if (!table) return safeSql``

  if (enforceExactCount) {
    const query = new Query()
    let queryChains = query.from(table.name, table.schema ?? undefined).count()
    filters
      .filter((x) => x.value && x.value !== '')
      .forEach((x) => {
        queryChains = queryChains.filter(x.column, x.operator, x.value)
      })
    const queryChainsSql = queryChains.toSql()
    const queryChainsSqlWithoutSemicolon = queryChainsSql.endsWith(';')
      ? (queryChainsSql.slice(0, -1) as SafeSqlFragment)
      : queryChainsSql
    return safeSql`select (${queryChainsSqlWithoutSemicolon}), false as is_estimate;`
  } else {
    const selectQuery = new Query()
    let selectQueryChains = selectQuery.from(table.name, table.schema ?? undefined).select()
    filters
      .filter((x) => x.value && x.value != '')
      .forEach((x) => {
        selectQueryChains = selectQueryChains.filter(x.column, x.operator, x.value)
      })
    const selectBaseSql = selectQueryChains.toSql()
    const selectBaseSqlWithoutSemicolon = selectBaseSql.endsWith(';')
      ? (selectBaseSql.slice(0, -1) as SafeSqlFragment)
      : selectBaseSql

    const countQuery = new Query()
    let countQueryChains = countQuery.from(table.name, table.schema ?? undefined).count()
    filters
      .filter((x) => x.value && x.value != '')
      .forEach((x) => {
        countQueryChains = countQueryChains.filter(x.column, x.operator, x.value)
      })
    const countBaseSql = countQueryChains.toSql()
    const countBaseSqlWithoutSemicolon = countBaseSql.endsWith(';')
      ? (countBaseSql.slice(0, -1) as SafeSqlFragment)
      : countBaseSql

    if (isReadOnlyContext) {
      if (scoped) {
        // Readonly context cannot create the pg_temp.count_estimate function, so
        // an unanalyzed (estimate = -1) or over-threshold table reports -1 with
        // is_estimate=true rather than running an exact count(*) that could time
        // out. The CASE and the is_estimate flag use the same condition.
        const sql = safeSql`
with approximation as (
    select reltuples as estimate
    from pg_class
    where oid = ${literal(table.id)}
)
select
  case
    when estimate > ${literal(THRESHOLD_COUNT)} or estimate = -1 then -1
    else (${countBaseSqlWithoutSemicolon})
  end as count,
  (estimate > ${literal(THRESHOLD_COUNT)} or estimate = -1) as is_estimate
from approximation;
`

        return sql
      }
      const sql = safeSql`
with approximation as (
    select reltuples as estimate
    from pg_class
    where oid = ${literal(table.id)}
)
select 
  case 
    when estimate > ${literal(THRESHOLD_COUNT)} then (select -1)
    else (${countBaseSqlWithoutSemicolon})
  end as count,
  estimate > ${literal(THRESHOLD_COUNT)} as is_estimate
from approximation;
`

      return sql
    } else {
      if (scoped) {
        // Never-analyzed tables report estimate = -1; treat that like
        // over-threshold and use the EXPLAIN-based estimate (works via relpages
        // without ANALYZE) so a bulk-loaded table never runs an exact count(*)
        // that could time out. Over-threshold keeps the legacy behavior (raw
        // estimate when unfiltered, count_estimate over the filtered select
        // otherwise). The CASE and is_estimate flag share one condition.
        const sql = safeSql`
${COUNT_ESTIMATE_SQL}

with approximation as (
    select reltuples as estimate
    from pg_class
    where oid = ${literal(table.id)}
)
select
  case
    when estimate = -1 then pg_temp.count_estimate('${selectBaseSqlWithoutSemicolon.replaceAll("'", "''") as SafeSqlFragment}')
    when estimate > ${literal(THRESHOLD_COUNT)} then ${filters.length > 0 ? safeSql`pg_temp.count_estimate('${selectBaseSqlWithoutSemicolon.replaceAll("'", "''") as SafeSqlFragment}')` : safeSql`estimate`}
    else (${countBaseSqlWithoutSemicolon})
  end as count,
  (estimate > ${literal(THRESHOLD_COUNT)} or estimate = -1) as is_estimate
from approximation;
`

        return sql
      }
      const sql = safeSql`
${COUNT_ESTIMATE_SQL}

with approximation as (
    select reltuples as estimate
    from pg_class
    where oid = ${literal(table.id)}
)
select 
  case 
    when estimate > ${literal(THRESHOLD_COUNT)} then ${filters.length > 0 ? safeSql`pg_temp.count_estimate('${selectBaseSqlWithoutSemicolon.replaceAll("'", "''") as SafeSqlFragment}')` : safeSql`estimate`}
    else (${countBaseSqlWithoutSemicolon})
  end as count,
  estimate > ${literal(THRESHOLD_COUNT)} as is_estimate
from approximation;
`

      return sql
    }
  }
}
