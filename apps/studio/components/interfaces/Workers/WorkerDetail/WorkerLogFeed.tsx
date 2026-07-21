import dayjs from 'dayjs'
import { cn } from 'ui'

import type { WorkerLogLine } from '../Workers.types'

const LEVEL_CLASSES: Record<WorkerLogLine['level'], string> = {
  debug: 'text-foreground-lighter',
  info: 'text-foreground-light',
  warn: 'text-warning',
  error: 'text-destructive',
}

const statusClass = (status?: number) => {
  if (status === undefined) return 'text-foreground-light'
  if (status >= 500) return 'text-destructive'
  if (status >= 400) return 'text-warning'
  return 'text-brand'
}

/**
 * Shared log-line renderer for a worker's feed. All lines go to Logflare in
 * production. Lifecycle lines are tagged distinctly (a "lifecycle" chip) so
 * they never read as a normal stdout/request line. `showLifecycle` toggles
 * whether lifecycle-kind lines are interleaved (true) or filtered out for a
 * clean request/stdout feed (false).
 */
export const WorkerLogFeed = ({
  logs,
  showLifecycle = true,
  emptyMessage = 'No log lines yet',
  className,
}: {
  logs: readonly WorkerLogLine[]
  showLifecycle?: boolean
  emptyMessage?: string
  className?: string
}) => {
  const visible = showLifecycle ? logs : logs.filter((line) => line.kind !== 'lifecycle')

  if (visible.length === 0) {
    return (
      <div className={cn('flex h-full items-center justify-center', className)}>
        <p className="text-xs text-foreground-lighter">{emptyMessage}</p>
      </div>
    )
  }

  return (
    <div className={cn('flex flex-col divide-y divide-border/50 font-mono text-xs', className)}>
      {visible.map((line) => (
        <div key={line.id} className="flex items-start gap-3 px-3 py-1.5">
          <span className="shrink-0 tabular-nums text-foreground-lighter">
            {dayjs(line.timestamp).format('HH:mm:ss')}
          </span>

          {line.kind === 'lifecycle' ? (
            <span className="shrink-0 rounded-sm border border-border-strong px-1 text-[10px] uppercase leading-4 text-foreground-lighter">
              lifecycle
            </span>
          ) : line.kind === 'request' ? (
            <span className="shrink-0 rounded-sm bg-surface-300 px-1 text-[10px] uppercase leading-4 text-foreground-lighter">
              req
            </span>
          ) : (
            <span className="shrink-0 rounded-sm bg-surface-300 px-1 text-[10px] uppercase leading-4 text-foreground-lighter">
              out
            </span>
          )}

          {line.kind === 'request' ? (
            <span className="flex flex-1 flex-wrap items-center gap-2">
              <span className={cn('font-medium', statusClass(line.status))}>{line.status}</span>
              <span className="text-foreground-light">{line.method}</span>
              <span className="text-foreground">{line.path}</span>
              <span className="text-foreground-lighter">{line.durationMs}ms</span>
            </span>
          ) : (
            <span className={cn('flex-1 whitespace-pre-wrap break-all', LEVEL_CLASSES[line.level])}>
              {line.message}
            </span>
          )}
        </div>
      ))}
    </div>
  )
}
