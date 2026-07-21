import type { Worker, WorkerLogLine } from '../Workers.types'
import type { WorkerLifecycleState } from '@/lib/constants/workers'

export interface WorkerLogSession {
  id: string
  /** ISO timestamp the run started */
  startedAt: string
  /** what kicked off the run — "Deploy", "Resume", "Traffic" */
  trigger: string
  /** the state the run ended in (undefined if still active) */
  endState?: WorkerLifecycleState
  /** log lines for this run, newest-first */
  lines: WorkerLogLine[]
}

// A run starts when the worker (re)enters compute: a fresh deploy or a resume
// from suspend. Everything until the next such event belongs to that run.
const START_STATES: WorkerLifecycleState[] = ['deploying', 'resuming']

const triggerLabel = (state: WorkerLifecycleState, note?: string) => {
  if (state === 'deploying') return 'Deploy'
  if (state === 'resuming') return note?.toLowerCase().includes('traffic') ? 'Traffic' : 'Resume'
  return 'Run'
}

/**
 * Group a worker's logs into sessions ("runs"). Lifecycle and logs are stored
 * newest-first; we walk chronologically off the lifecycle events (which carry
 * state) to find run boundaries, then bucket log lines by timestamp. ISO-8601
 * UTC strings sort lexicographically, so string comparison is chronological.
 * Returned newest-session-first.
 */
export const groupLogsBySession = (worker: Worker): WorkerLogSession[] => {
  const lifecycleChrono = [...worker.lifecycle].reverse()
  const logsChrono = [...worker.logs].reverse()

  const starts = lifecycleChrono.filter((event) => START_STATES.includes(event.state))
  // Fall back to the earliest lifecycle event (or nothing) if there's no start.
  const boundaries = starts.length > 0 ? starts : lifecycleChrono.slice(0, 1)

  if (boundaries.length === 0) {
    return worker.logs.length > 0
      ? [{ id: 'session-0', startedAt: worker.logs[0].timestamp, trigger: 'Run', lines: [...worker.logs] }]
      : []
  }

  const sessions = boundaries.map((start, index) => {
    const startTs = start.timestamp
    const nextTs = boundaries[index + 1]?.timestamp
    const inRange = (ts: string) => ts >= startTs && (nextTs === undefined || ts < nextTs)

    const events = lifecycleChrono.filter((event) => inRange(event.timestamp))
    const endEvent = events[events.length - 1]

    return {
      id: `session-${index}`,
      startedAt: startTs,
      trigger: triggerLabel(start.state, start.note),
      endState: endEvent && !START_STATES.includes(endEvent.state) ? endEvent.state : undefined,
      lines: logsChrono.filter((line) => inRange(line.timestamp)).reverse(),
    }
  })

  return sessions.reverse()
}
