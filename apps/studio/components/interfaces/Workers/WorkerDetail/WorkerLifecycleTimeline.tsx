import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import { Fragment } from 'react'
import { cn } from 'ui'

import { WorkerStateDot } from '../WorkerBadges'
import type { WorkerLifecycleEvent } from '../Workers.types'
import { WORKER_STATE_LABELS } from '@/lib/constants/workers'

dayjs.extend(relativeTime)

/**
 * 5b — a compact horizontal timeline strip of lifecycle transitions, sat above
 * the log feed. Reused (smaller) inside the cockpit center pane. `lifecycle` is
 * newest-first; we render oldest→newest left-to-right.
 */
export const WorkerLifecycleTimeline = ({
  lifecycle,
  compact = false,
  className,
}: {
  lifecycle: readonly WorkerLifecycleEvent[]
  compact?: boolean
  className?: string
}) => {
  const ordered = [...lifecycle].reverse()

  if (ordered.length === 0) {
    return <p className="text-xs text-foreground-lighter">No lifecycle events yet</p>
  }

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
