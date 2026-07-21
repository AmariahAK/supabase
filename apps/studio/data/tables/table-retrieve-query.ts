import pgMeta from '@supabase/pg-meta'
import { useQuery } from '@tanstack/react-query'
import { useFlag } from 'common'

import { tableKeys } from './keys'
import { PG_META_SCOPED_INTROSPECTION_FLAG } from '@/data/table-editor/table-editor-query'
import { getQueryClient } from '@/data/query-client'
import { executeSql } from '@/data/sql/execute-sql-mutation'
import type { SafePostgresTable } from '@/lib/postgres-types'
import type { ResponseError, UseCustomQueryOptions } from '@/types'

export type TablesVariables = {
  projectRef?: string
  connectionString?: string | null
  name: string
  schema: string
  scoped?: boolean
}

export async function getTable(
  { projectRef, connectionString, name, schema, scoped = false }: TablesVariables,
  signal?: AbortSignal
): Promise<SafePostgresTable> {
  const { sql, zod } = pgMeta.tables.retrieve({ name, schema, scoped })

  const { result } = await executeSql(
    {
      projectRef,
      connectionString,
      sql,
      queryKey: tableKeys.retrieve(projectRef, name, schema, { scoped: !!scoped }),
    },
    signal
  )
  // pg-meta sources `check` from pg_catalog; treat it as SafeSqlFragment for DDL composition.
  return zod.parse(result[0]) as unknown as SafePostgresTable
}

export type RetrieveTableResult = Awaited<ReturnType<typeof getTable>>
export type RetrieveTableError = ResponseError
export type RetrievedTableColumn = NonNullable<RetrieveTableResult['columns']>[number]

export const useTableQuery = <TData = RetrieveTableResult>(
  { projectRef, connectionString, name, schema }: TablesVariables,
  {
    enabled = true,
    ...options
  }: UseCustomQueryOptions<RetrieveTableResult, RetrieveTableError, TData> = {}
) => {
  const scoped = !!useFlag(PG_META_SCOPED_INTROSPECTION_FLAG)

  return useQuery<RetrieveTableResult, RetrieveTableError, TData>({
    queryKey: tableKeys.retrieve(projectRef, name, schema, { scoped }),
    queryFn: ({ signal }) =>
      getTable({ projectRef, connectionString, name, schema, scoped }, signal),
    enabled: enabled && typeof projectRef !== 'undefined',
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    staleTime: 5 * 60 * 1000,
    ...options,
  })
}

/**
 * Non-hook usage to fetch data + caching it into the store
 */
export const getTableQuery = async ({
  projectRef,
  name,
  schema,
  connectionString,
  scoped = false,
}: {
  projectRef: string
  name: string
  schema: string
  connectionString?: string | null
  scoped?: boolean
}) => {
  const queryClient = getQueryClient()
  const table = await queryClient.fetchQuery({
    // eslint-disable-next-line @tanstack/query/exhaustive-deps
    queryKey: tableKeys.retrieve(projectRef, name, schema, { scoped: !!scoped }),
    queryFn: ({ signal }) =>
      getTable({ projectRef, connectionString, name, schema, scoped }, signal),
  })
  return table
}
