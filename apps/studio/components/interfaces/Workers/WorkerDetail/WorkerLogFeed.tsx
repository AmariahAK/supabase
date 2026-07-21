import dayjs from 'dayjs'
import { cn } from 'ui'

import type { WorkerLogLine } from '../Workers.types'
import { type WorkerLifecycleState } from '@/lib/constants/workers'

type Tone = 'brand' | 'muted' | 'destructive'

// Lifecycle events render as distinct banded rows in the stream (design 5a):
// a colored left accent + faint band, timestamp, diamond marker, an uppercase
// label and a short description.
const LIFECYCLE_DISPLAY: Record<WorkerLifecycleState, { label: string; tone: Tone }> = {
  deploying: { label: 'CREATE', tone: 'brand' },
  active: { label: 'ACTIVE', tone: 'brand' },
  resuming: { label: 'RESUME', tone: 'brand' },
  suspended: { label: 'SUSPEND', tone: 'muted' },
  draining: { label: 'DRAIN', tone: 'muted' },
  errored: { label: 'ERROR', tone: 'destructive' },
  killed: { label: 'DELETE', tone: 'destructive' },
}

const TONE_BAND: Record<Tone, string> = {
  brand: 'border-brand bg-brand/10',
  muted: 'border-foreground-muted bg-surface-200/60',
  destructive: 'border-destructive-400 bg-destructive-200/30',
}

const TONE_TEXT: Record<Tone, string> = {
  brand: 'text-brand',
  muted: 'text-foreground-light',
  destructive: 'text-destructive',
}

const statusClass = (status?: number) => {
  if (status === undefined) return 'text-foreground-light'
  if (status >= 500) return 'text-destructive'
  if (status >= 400) return 'text-warning'
  return 'text-brand'
}

/**
 * Shared log-line renderer. Request/stdout lines render as plain rows; lifecycle
 * lines render as banded rows (5a). `showLifecycle` filters lifecycle rows out
 * when a clean request/stdout feed is wanted.
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
      <div className={cn('flex h-full items-center justify-center py-8', className)}>
        <p className="text-xs text-foreground-lighter">{emptyMessage}</p>
      </div>
    )
  }

  return (
    <div className={cn('flex flex-col py-1 font-mono text-xs', className)}>
      {visible.map((line) => {
        const time = dayjs(line.timestamp).format('HH:mm:ss')

        if (line.kind === 'lifecycle') {
          const display = line.state ? LIFECYCLE_DISPLAY[line.state] : undefined
          const tone = display?.tone ?? 'muted'
          return (
            <div
              key={line.id}
              className={cn(
                'my-0.5 flex items-center gap-3 border-l-2 py-2 pl-3 pr-3',
                TONE_BAND[tone]
              )}
            >
              <span className={cn('shrink-0 tabular-nums opacity-80', TONE_TEXT[tone])}>
                {time}
              </span>
              <span className={cn('shrink-0', TONE_TEXT[tone])} aria-hidden>
                ◆
              </span>
              <span className={cn('shrink-0 font-medium tracking-wide', TONE_TEXT[tone])}>
                {display?.label ?? 'EVENT'}
              </span>
              <span className="truncate text-foreground-light">{line.message}</span>
            </div>
          )
        }

        return (
          <div key={line.id} className="flex items-start gap-3 px-3 py-1.5">
            <span className="shrink-0 tabular-nums text-foreground-lighter">{time}</span>
            <span className="w-8 shrink-0 text-foreground-lighter">
              {line.kind === 'request' ? 'req' : 'info'}
            </span>
            {line.kind === 'request' ? (
              <span className="flex flex-1 flex-wrap items-center gap-2">
                <span className="text-foreground-light">{line.method}</span>
                <span className="text-foreground">{line.path}</span>
                <span className={cn('font-medium', statusClass(line.status))}>{line.status}</span>
                <span className="text-foreground-lighter">· {line.durationMs}ms</span>
              </span>
            ) : (
              <span className="flex-1 whitespace-pre-wrap break-all text-foreground-light">
                {line.message}
              </span>
            )}
          </div>
        )
      })}
    </div>
  )
}
