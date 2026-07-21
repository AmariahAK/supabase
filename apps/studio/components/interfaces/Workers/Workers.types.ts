import type {
  WorkerAccessMode,
  WorkerLifecycleState,
  WorkerRuntimeId,
  WorkerSizeId,
} from '@/lib/constants/workers'

/** Who performed an action (deploy, delete, etc). */
export interface WorkerActor {
  type: 'user' | 'cli' | 'system'
  name: string
}

export type WorkerLogLevel = 'debug' | 'info' | 'warn' | 'error'

/**
 * A single line in a worker's log feed. `kind` distinguishes request logs from
 * worker stdout/stderr from lifecycle events — lifecycle lines are tagged
 * distinctly so they never read as a normal stdout line (all three go to
 * Logflare in production).
 */
export interface WorkerLogLine {
  id: string
  /** ISO timestamp */
  timestamp: string
  level: WorkerLogLevel
  kind: 'request' | 'stdout' | 'lifecycle'
  message: string
  // request-only fields
  method?: string
  path?: string
  status?: number
  durationMs?: number
}

/** A discrete lifecycle transition, surfaced in the timeline strip. */
export interface WorkerLifecycleEvent {
  id: string
  /** ISO timestamp */
  timestamp: string
  state: WorkerLifecycleState
  note?: string
}

export interface Worker {
  id: string
  slug: string
  name: string
  runtime: WorkerRuntimeId
  size: WorkerSizeId
  access: WorkerAccessMode
  state: WorkerLifecycleState
  region: string
  /** number of instances in this deploy (1–10) */
  instances: number
  /** ISO timestamp */
  createdAt: string
  createdBy: WorkerActor
  /** seconds since the last observed traffic — drives scale-to-zero */
  idleSeconds: number
  /** present only for public workers */
  endpoint?: string
  /** newest-first (index 0 = most recent) */
  logs: WorkerLogLine[]
  /** newest-first (index 0 = most recent) */
  lifecycle: WorkerLifecycleEvent[]
}
