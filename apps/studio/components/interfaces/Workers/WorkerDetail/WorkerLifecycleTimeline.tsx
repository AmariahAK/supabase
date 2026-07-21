import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import { Fragment } from 'react'
import { cn } from 'ui'

import { WorkerStateDot } from '../WorkerBadges'
import type { WorkerLifecycleEvent } from '../Workers.types'
import { WORKER_STATE_LABELS } from '@/lib/constants/workers'

dayjs.extend(relativeTime)

/**
 * Lifecycle transitions. Horizontal renders a compact strip (oldest→newest,
 * left-to-right). Vertical renders a stacked timeline (newest→oldest, top-down)
 * which scales better for high-volume history in a narrow column.
 */
export const WorkerLifecycleTimeline = ({
  lifecycle,
  orientation = 'horizontal',
  compact = false,
  className,
}: {
  lifecycle: readonly WorkerLifecycleEvent[]
  orientation?: 'horizontal' | 'vertical'
  compact?: boolean
  className?: string
}) => {
  if (lifecycle.length === 0) {
    return <p className="text-xs text-foreground-lighter">No lifecycle events yet</p>
  }

  if (orientation === 'vertical') {
    // Stored newest-first — render as-is so the latest state is at the top.
    return (
      <div className={cn('flex flex-col', className)}>
        {lifecycle.map((event, index) => (
          <div key={event.id} className="flex gap-3">
            <div className="flex flex-col items-center">
              <WorkerStateDot state={event.state} className="mt-1.5" />
              {index < lifecycle.length - 1 && <span className="w-px flex-1 bg-border-strong" />}
            </div>
            <div className={cn('min-w-0', index < lifecycle.length - 1 && 'pb-4')}>
              <p className="text-sm text-foreground">{WORKER_STATE_LABELS[event.state]}</p>
              <p className="text-xs text-foreground-lighter">{dayjs(event.timestamp).fromNow()}</p>
              {event.note && (
                <p className="mt-0.5 text-xs text-foreground-lighter">{event.note}</p>
              )}
            </div>
          </div>
        ))}
      </div>
    )
  }

  // Horizontal: oldest→newest, left-to-right.
  const ordered = [...lifecycle].reverse()
  return (
    <div className={cn('flex flex-wrap items-center gap-x-1 gap-y-2', className)}>
      {ordered.map((event, index) => (
        <Fragment key={event.id}>
          {index > 0 && <span className="h-px w-4 bg-border-strong" aria-hidden />}
          <div className="flex items-center gap-1.5">
            <WorkerStateDot state={event.state} />
            <div className="leading-tight">
              <p className={cn('text-foreground', compact ? 'text-xs' : 'text-sm')}>
                {WORKER_STATE_LABELS[event.state]}
              </p>
              {!compact && (
                <p className="text-xs text-foreground-lighter">{dayjs(event.timestamp).fromNow()}</p>
              )}
            </div>
          </div>
        </Fragment>
      ))}
    </div>
  )
}
