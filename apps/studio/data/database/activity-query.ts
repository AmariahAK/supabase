import { getPgStatActivitySql } from '@supabase/pg-meta'
import { useQuery } from '@tanstack/react-query'

import { databaseKeys } from './keys'
import { executeSql } from '@/data/sql/execute-sql-mutation'
import { ResponseError, UseCustomQueryOptions } from '@/types'

type LockWaitEvent =
  | 'relation'
  | 'extend'
  | 'page'
  | 'tuple'
  | 'transactionid'
  | 'virtualxid'
  | 'speculative token'
  | 'object'
  | 'userlock'
  | 'advisory'
  | 'applytransaction'

type ClientWaitEvent = 'ClientRead' | 'ClientWrite' | 'WalSenderWaitForWAL' | 'WalSenderWriteData'

type TimeoutWaitEvent =
  | 'BaseBackupThrottle'
  | 'CheckpointWriteDelay'
  | 'PgSleep'
  | 'RecoveryApplyDelay'
  | 'VacuumDelay'
  | 'VacuumTruncate'

type ActivityWaitEvent =
  | 'ArchiverMain'
  | 'AutoVacuumMain'
  | 'BgWriterHibernate'
  | 'BgWriterMain'
  | 'CheckpointerMain'
  | 'LogicalApplyMain'
  | 'LogicalLauncherMain'
  | 'WalReceiverMain'
  | 'WalSenderMain'
  | 'WalWriterMain'

type BufferPinWaitEvent = 'BufferPin'
type IOWaitEvent = string
type IPCWaitEvent = string
type LWLockWaitEvent = string

/**
 * wait_event_type: What the session is blocked on
 * wait_event: The specific event within that wait type
 * */
type WaitEvent =
  | { wait_event_type: 'Lock'; wait_event: LockWaitEvent }
  | { wait_event_type: 'Client'; wait_event: ClientWaitEvent }
  | { wait_event_type: 'Timeout'; wait_event: TimeoutWaitEvent }
  | { wait_event_type: 'Activity'; wait_event: ActivityWaitEvent }
  | { wait_event_type: 'BufferPin'; wait_event: BufferPinWaitEvent }
  | { wait_event_type: 'Extension'; wait_event: string }
  | { wait_event_type: 'IO'; wait_event: IOWaitEvent }
  | { wait_event_type: 'IPC'; wait_event: IPCWaitEvent }
  | { wait_event_type: 'LWLock'; wait_event: LWLockWaitEvent }
  | { wait_event_type: null; wait_event: null }

export type DatabaseActivity = {
  pid: number
  role_name: string
  application_name: string
  blocked_by: number[]
  query: string | null
  query_start: string | null
  transaction_start: string | null
  state_change: string | null
  state:
    | 'idle'
    | 'active'
    | 'idle in transaction'
    | 'idle in transaction (aborted)'
    | 'fastpath function call'
    | 'disabled'
    | null
} & WaitEvent

export type DatabaseActivityVariables = {
  projectRef?: string
  connectionString?: string | null
}

export async function getDatabaseActivity(
  { projectRef, connectionString }: DatabaseActivityVariables,
  signal?: AbortSignal
) {
  return [
    // idle — long-parked connection, nothing interesting
    {
      pid: 101,
      role_name: 'postgres',
      application_name: 'psql',
      blocked_by: [],
      query: 'SELECT 1',
      query_start: '2026-07-22T02:48:42.000Z',
      transaction_start: null,
      state_change: '2026-07-22T02:48:42.000Z',
      state: 'idle',
      wait_event_type: null,
      wait_event: null,
    },
    // active — fast query, under the 30s warning threshold
    {
      pid: 102,
      role_name: 'authenticator',
      application_name: 'PostgREST',
      blocked_by: [],
      query: 'select * from profiles where id = $1',
      query_start: '2026-07-22T03:48:37.000Z',
      transaction_start: '2026-07-22T03:48:37.000Z',
      state_change: '2026-07-22T03:48:37.000Z',
      state: 'active',
      wait_event_type: null,
      wait_event: null,
    },
    // active — over 30s, should trigger the "long running" warning (text-warning)
    {
      pid: 103,
      role_name: 'service_role',
      application_name: 'Prisma',
      blocked_by: [],
      query: 'update orders set status = $1 where id = $2',
      query_start: '2026-07-22T03:47:57.000Z',
      transaction_start: '2026-07-22T03:47:57.000Z',
      state_change: '2026-07-22T03:47:57.000Z',
      state: 'active',
      wait_event_type: null,
      wait_event: null,
    },
    // idle in transaction — under 10s threshold, shouldn't count toward the flagged metric yet
    {
      pid: 104,
      role_name: 'postgres',
      application_name: 'psql',
      blocked_by: [],
      query: 'select * from accounts for update',
      query_start: '2026-07-22T03:48:37.000Z',
      transaction_start: '2026-07-22T03:48:37.000Z',
      state_change: '2026-07-22T03:48:37.000Z',
      state: 'idle in transaction',
      wait_event_type: null,
      wait_event: null,
    },
    // idle in transaction — over 10s, should be flagged (text-destructive) and count in the metric
    {
      pid: 105,
      role_name: 'supabase_admin',
      application_name: 'pg_dump',
      blocked_by: [],
      query: 'select * from large_table',
      query_start: '2026-07-22T03:47:57.000Z',
      transaction_start: '2026-07-22T03:47:57.000Z',
      state_change: '2026-07-22T03:47:57.000Z',
      state: 'idle in transaction',
      wait_event_type: null,
      wait_event: null,
    },
    // idle in transaction (aborted) — over 10s, flagged, transaction failed but never rolled back
    {
      pid: 106,
      role_name: 'postgres',
      application_name: 'node-postgres',
      blocked_by: [],
      query: 'insert into logs (message) values ($1)',
      query_start: '2026-07-22T03:48:27.000Z',
      transaction_start: '2026-07-22T03:48:27.000Z',
      state_change: '2026-07-22T03:48:27.000Z',
      state: 'idle in transaction (aborted)',
      wait_event_type: null,
      wait_event: null,
    },
    // idle in transaction (aborted) — under 10s, not yet flagged
    {
      pid: 107,
      role_name: 'authenticator',
      application_name: 'PostgREST',
      blocked_by: [],
      query: 'delete from sessions where id = $1',
      query_start: '2026-07-22T03:48:37.000Z',
      transaction_start: '2026-07-22T03:48:37.000Z',
      state_change: '2026-07-22T03:48:37.000Z',
      state: 'idle in transaction (aborted)',
      wait_event_type: null,
      wait_event: null,
    },
    // active + blocked — waiting on a row lock held by pid 105
    {
      pid: 108,
      role_name: 'service_role',
      application_name: 'supabase-realtime',
      blocked_by: [105],
      query: 'select * from large_table where id = $1 for update',
      query_start: '2026-07-22T03:48:17.000Z',
      transaction_start: '2026-07-22T03:48:17.000Z',
      state_change: '2026-07-22T03:48:17.000Z',
      state: 'active',
      wait_event_type: 'Lock',
      wait_event: 'tuple',
    },
    // active + blocked — waiting on pid 103's row-level lock
    {
      pid: 109,
      role_name: 'authenticator',
      application_name: 'PostgREST',
      blocked_by: [103],
      query: 'update orders set status = $1 where id = $2',
      query_start: '2026-07-22T03:48:22.000Z',
      transaction_start: '2026-07-22T03:48:22.000Z',
      state_change: '2026-07-22T03:48:22.000Z',
      state: 'active',
      wait_event_type: 'Lock',
      wait_event: 'relation',
    },
    // idle — background worker, parked for an hour
    {
      pid: 110,
      role_name: 'postgres',
      application_name: 'pgbouncer',
      blocked_by: [],
      query: 'SELECT 1',
      query_start: '2026-07-22T02:48:42.000Z',
      transaction_start: null,
      state_change: '2026-07-22T02:48:42.000Z',
      state: 'idle',
      wait_event_type: null,
      wait_event: null,
    },
    // active — the "longest running" query, should win the reduce() and show text-warning
    {
      pid: 111,
      role_name: 'postgres',
      application_name: 'pg_dump',
      blocked_by: [],
      query: 'copy (select * from events) to stdout',
      query_start: '2026-07-22T03:28:42.000Z',
      transaction_start: '2026-07-22T03:28:42.000Z',
      state_change: '2026-07-22T03:28:42.000Z',
      state: 'active',
      wait_event_type: 'IO',
      wait_event: 'DataFileRead',
    },
    // disabled — edge case, track_activities off for this session
    {
      pid: 112,
      role_name: 'supabase_admin',
      application_name: 'monitoring',
      blocked_by: [],
      query: null,
      query_start: null,
      transaction_start: null,
      state_change: '2026-07-22T02:48:42.000Z',
      state: 'disabled',
      wait_event_type: null,
      wait_event: null,
    },
    {
      pid: 201,
      role_name: 'authenticator',
      application_name: 'PostgREST',
      blocked_by: [202],
      query: 'update orders set status = $1 where id = $2',
      query_start: '2026-07-22T03:48:55.000Z',
      transaction_start: '2026-07-22T03:48:55.000Z',
      state_change: '2026-07-22T03:48:55.000Z',
      state: 'active',
      wait_event_type: 'Lock',
      wait_event: 'tuple',
    },
    // active — waiting on pid 203
    {
      pid: 202,
      role_name: 'authenticator',
      application_name: 'PostgREST',
      blocked_by: [203],
      query: 'update orders set status = $1 where id = $2',
      query_start: '2026-07-22T03:48:50.000Z',
      transaction_start: '2026-07-22T03:48:50.000Z',
      state_change: '2026-07-22T03:48:50.000Z',
      state: 'active',
      wait_event_type: 'Lock',
      wait_event: 'tuple',
    },
    // active — waiting on pid 204, the root of the chain
    {
      pid: 203,
      role_name: 'service_role',
      application_name: 'Prisma',
      blocked_by: [204],
      query: 'select * from orders where id = $1 for update',
      query_start: '2026-07-22T03:48:45.000Z',
      transaction_start: '2026-07-22T03:48:45.000Z',
      state_change: '2026-07-22T03:48:45.000Z',
      state: 'active',
      wait_event_type: 'Lock',
      wait_event: 'relation',
    },
    // idle in transaction (aborted) — root holder, 40s, over the 10s threshold, flagged
    {
      pid: 204,
      role_name: 'postgres',
      application_name: 'node-postgres',
      blocked_by: [],
      query: 'update orders set status = $1 where id = $2',
      query_start: '2026-07-22T03:48:20.000Z',
      transaction_start: '2026-07-22T03:48:20.000Z',
      state_change: '2026-07-22T03:48:20.000Z',
      state: 'idle in transaction (aborted)',
      wait_event_type: null,
      wait_event: null,
    },

    // ── Chain B: 3-deep, middle link is itself idle in transaction (edge case) ──
    // active — waiting on pid 206
    {
      pid: 205,
      role_name: 'service_role',
      application_name: 'supabase-realtime',
      blocked_by: [206],
      query: 'select * from accounts where id = $1 for update',
      query_start: '2026-07-22T03:48:52.000Z',
      transaction_start: '2026-07-22T03:48:52.000Z',
      state_change: '2026-07-22T03:48:52.000Z',
      state: 'active',
      wait_event_type: 'Lock',
      wait_event: 'tuple',
    },
    // idle in transaction — parked mid-transaction, but itself still counted as blocked on pid 207, under 10s
    {
      pid: 206,
      role_name: 'postgres',
      application_name: 'psql',
      blocked_by: [207],
      query: 'select * from accounts for update',
      query_start: '2026-07-22T03:48:57.000Z',
      transaction_start: '2026-07-22T03:48:57.000Z',
      state_change: '2026-07-22T03:48:57.000Z',
      state: 'idle in transaction',
      wait_event_type: null,
      wait_event: null,
    },
    // idle in transaction — root holder, 2s, under 10s, not yet flagged
    {
      pid: 207,
      role_name: 'postgres',
      application_name: 'psql',
      blocked_by: [],
      query: 'select * from accounts for update',
      query_start: '2026-07-22T03:48:58.000Z',
      transaction_start: '2026-07-22T03:48:58.000Z',
      state_change: '2026-07-22T03:48:58.000Z',
      state: 'active',
      wait_event_type: null,
      wait_event: null,
    },

    // ── Chain C: simple pair, root is a long-running active query (45s, flagged) ──
    {
      pid: 208,
      role_name: 'authenticator',
      application_name: 'PostgREST',
      blocked_by: [209],
      query: 'select * from large_table where id = $1 for update',
      query_start: '2026-07-22T03:48:40.000Z',
      transaction_start: '2026-07-22T03:48:40.000Z',
      state_change: '2026-07-22T03:48:40.000Z',
      state: 'active',
      wait_event_type: 'Lock',
      wait_event: 'relation',
    },
    {
      pid: 209,
      role_name: 'supabase_admin',
      application_name: 'pg_dump',
      blocked_by: [],
      query: 'copy (select * from large_table) to stdout',
      query_start: '2026-07-22T03:48:15.000Z',
      transaction_start: '2026-07-22T03:48:15.000Z',
      state_change: '2026-07-22T03:48:15.000Z',
      state: 'active',
      wait_event_type: 'IO',
      wait_event: 'DataFileRead',
    },

    // ── Standalone idle in transaction ──
    // under 10s, not flagged
    {
      pid: 210,
      role_name: 'postgres',
      application_name: 'psql',
      blocked_by: [],
      query: 'select * from invoices for update',
      query_start: '2026-07-22T03:48:55.000Z',
      transaction_start: '2026-07-22T03:48:55.000Z',
      state_change: '2026-07-22T03:48:55.000Z',
      state: 'idle in transaction',
      wait_event_type: null,
      wait_event: null,
    },
    // over 10s, flagged (also blocking pid 224 below)
    {
      pid: 211,
      role_name: 'service_role',
      application_name: 'Prisma',
      blocked_by: [],
      query: 'select * from invoices for update',
      query_start: '2026-07-22T03:48:35.000Z',
      transaction_start: '2026-07-22T03:48:35.000Z',
      state_change: '2026-07-22T03:48:35.000Z',
      state: 'idle in transaction',
      wait_event_type: null,
      wait_event: null,
    },

    // ── Standalone idle in transaction (aborted) ──
    // under 10s, not flagged
    {
      pid: 212,
      role_name: 'authenticator',
      application_name: 'PostgREST',
      blocked_by: [],
      query: 'delete from sessions where id = $1',
      query_start: '2026-07-22T03:48:54.000Z',
      transaction_start: '2026-07-22T03:48:54.000Z',
      state_change: '2026-07-22T03:48:54.000Z',
      state: 'idle in transaction (aborted)',
      wait_event_type: null,
      wait_event: null,
    },
    // over 10s, flagged (also blocking pid 224 below)
    {
      pid: 213,
      role_name: 'postgres',
      application_name: 'node-postgres',
      blocked_by: [],
      query: 'insert into audit_log (message) values ($1)',
      query_start: '2026-07-22T03:48:20.000Z',
      transaction_start: '2026-07-22T03:48:20.000Z',
      state_change: '2026-07-22T03:48:20.000Z',
      state: 'idle in transaction (aborted)',
      wait_event_type: null,
      wait_event: null,
    },

    // ── Standalone active, fast (under 30s) ──
    {
      pid: 214,
      role_name: 'authenticator',
      application_name: 'PostgREST',
      blocked_by: [],
      query: 'select * from products where id = $1',
      query_start: '2026-07-22T03:48:55.000Z',
      transaction_start: '2026-07-22T03:48:55.000Z',
      state_change: '2026-07-22T03:48:55.000Z',
      state: 'active',
      wait_event_type: null,
      wait_event: null,
    },
    {
      pid: 215,
      role_name: 'service_role',
      application_name: 'supabase-realtime',
      blocked_by: [],
      query: 'select * from messages where channel_id = $1',
      query_start: '2026-07-22T03:48:58.000Z',
      transaction_start: '2026-07-22T03:48:58.000Z',
      state_change: '2026-07-22T03:48:58.000Z',
      state: 'active',
      wait_event_type: null,
      wait_event: null,
    },

    // ── Standalone active, very long running (90s, flagged, not blocked by anyone) ──
    {
      pid: 216,
      role_name: 'postgres',
      application_name: 'pg_dump',
      blocked_by: [],
      query: 'copy (select * from events) to stdout',
      query_start: '2026-07-22T03:47:30.000Z',
      transaction_start: '2026-07-22T03:47:30.000Z',
      state_change: '2026-07-22T03:47:30.000Z',
      state: 'active',
      wait_event_type: 'IO',
      wait_event: 'DataFileRead',
    },

    // ── Standalone idle, background noise ──
    {
      pid: 217,
      role_name: 'postgres',
      application_name: 'pgbouncer',
      blocked_by: [],
      query: 'SELECT 1',
      query_start: '2026-07-22T02:49:00.000Z',
      transaction_start: null,
      state_change: '2026-07-22T02:49:00.000Z',
      state: 'idle',
      wait_event_type: null,
      wait_event: null,
    },
    {
      pid: 218,
      role_name: 'postgres',
      application_name: 'psql',
      blocked_by: [],
      query: 'SELECT 1',
      query_start: '2026-07-22T02:49:00.000Z',
      transaction_start: null,
      state_change: '2026-07-22T02:49:00.000Z',
      state: 'idle',
      wait_event_type: null,
      wait_event: null,
    },

    // ── Chain D: 5-deep lock chain, deepest nesting, root is aborted (50s, flagged) ──
    {
      pid: 219,
      role_name: 'authenticator',
      application_name: 'PostgREST',
      blocked_by: [220],
      query: 'update accounts set balance = $1 where id = $2',
      query_start: '2026-07-22T03:48:50.000Z',
      transaction_start: '2026-07-22T03:48:50.000Z',
      state_change: '2026-07-22T03:48:50.000Z',
      state: 'active',
      wait_event_type: 'Lock',
      wait_event: 'tuple',
    },
    {
      pid: 220,
      role_name: 'authenticator',
      application_name: 'PostgREST',
      blocked_by: [221],
      query: 'update accounts set balance = $1 where id = $2',
      query_start: '2026-07-22T03:48:45.000Z',
      transaction_start: '2026-07-22T03:48:45.000Z',
      state_change: '2026-07-22T03:48:45.000Z',
      state: 'active',
      wait_event_type: 'Lock',
      wait_event: 'tuple',
    },
    {
      pid: 221,
      role_name: 'service_role',
      application_name: 'Prisma',
      blocked_by: [222],
      query: 'update accounts set balance = $1 where id = $2',
      query_start: '2026-07-22T03:48:40.000Z',
      transaction_start: '2026-07-22T03:48:40.000Z',
      state_change: '2026-07-22T03:48:40.000Z',
      state: 'active',
      wait_event_type: 'Lock',
      wait_event: 'tuple',
    },
    {
      pid: 222,
      role_name: 'service_role',
      application_name: 'supabase-realtime',
      blocked_by: [223],
      query: 'select * from accounts where id = $1 for update',
      query_start: '2026-07-22T03:48:35.000Z',
      transaction_start: '2026-07-22T03:48:35.000Z',
      state_change: '2026-07-22T03:48:35.000Z',
      state: 'active',
      wait_event_type: 'Lock',
      wait_event: 'relation',
    },
    // idle in transaction (aborted) — root of the 5-deep chain, 50s, flagged
    {
      pid: 223,
      role_name: 'postgres',
      application_name: 'node-postgres',
      blocked_by: [],
      query: 'update accounts set balance = $1 where id = $2',
      query_start: '2026-07-22T03:48:10.000Z',
      transaction_start: '2026-07-22T03:48:10.000Z',
      state_change: '2026-07-22T03:48:10.000Z',
      state: 'idle in transaction (aborted)',
      wait_event_type: null,
      wait_event: null,
    },

    // ── Multi-blocker: waiting on two independent transactions at once (pid 211 and pid 213) ──
    {
      pid: 224,
      role_name: 'authenticator',
      application_name: 'PostgREST',
      blocked_by: [211, 213],
      query: 'select * from invoices i join audit_log a on a.invoice_id = i.id where i.id = $1',
      query_start: '2026-07-22T03:48:50.000Z',
      transaction_start: '2026-07-22T03:48:50.000Z',
      state_change: '2026-07-22T03:48:50.000Z',
      state: 'active',
      wait_event_type: 'Lock',
      wait_event: 'transactionid',
    },
  ] as DatabaseActivity[]
  const sql = getPgStatActivitySql()

  const { result } = await executeSql(
    { projectRef, connectionString, sql, queryKey: ['activity'] },
    signal
  )

  return (result ?? []).filter(
    (x: DatabaseActivity) => !x.query?.startsWith(sql)
  ) as DatabaseActivity[]
}

export type DatabaseActivityData = Awaited<ReturnType<typeof getDatabaseActivity>>
export type DatabaseActivityError = ResponseError

export const useDatabaseActivityQuery = <TData = DatabaseActivityData>(
  { projectRef, connectionString }: DatabaseActivityVariables,
  {
    enabled = true,
    ...options
  }: UseCustomQueryOptions<DatabaseActivityData, DatabaseActivityError, TData> = {}
) =>
  useQuery<DatabaseActivityData, DatabaseActivityError, TData>({
    queryKey: databaseKeys.databaseActivity(projectRef),
    queryFn: ({ signal }) => getDatabaseActivity({ projectRef, connectionString }, signal),
    enabled: enabled && typeof projectRef !== 'undefined',
    ...options,
  })
