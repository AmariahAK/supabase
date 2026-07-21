import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import { ChevronDown, ChevronRight } from 'lucide-react'
import { useMemo, useState } from 'react'
import { cn } from 'ui'

import { WorkerLogFeed } from './WorkerLogFeed'
import { groupLogsBySession } from './workerSessions'
import { WorkerStateDot } from '../WorkerBadges'
import type { Worker } from '../Workers.types'
import { WORKER_STATE_LABELS } from '@/lib/constants/workers'

dayjs.extend(relativeTime)

export const WorkerLogSessions = ({ worker }: { worker: Worker }) => {
  const sessions = useMemo(
    () => groupLogsBySession(worker),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [worker.logs, worker.lifecycle]
  )

  const [expanded, setExpanded] = useState<Record<string, boolean>>({})

  if (sessions.length === 0) {
    return <p className="text-sm text-foreground-lighter">No sessions yet</p>
  }

  const toggle = (id: string, defaultOpen: boolean) =>
    setExpanded((prev) => ({ ...prev, [id]: !(prev[id] ?? defaultOpen) }))

  return (
    <div className="flex flex-col gap-2">
      {sessions.map((session, index) => {
        // Newest session is open by default.
        const isOpen = expanded[session.id] ?? index === 0
        const requestCount = session.lines.filter((line) => line.kind === 'request').length

        return (
          <div key={session.id} className="overflow-hidden rounded-md border border-default">
            <button
              onClick={() => toggle(session.id, index === 0)}
              className="flex w-full items-center gap-3 bg-surface-100 px-3 py-2 text-left hover:bg-surface-200"
            >
              {isOpen ? (
                <ChevronDown size={14} className="shrink-0 text-foreground-lighter" />
              ) : (
                <ChevronRight size={14} className="shrink-0 text-foreground-lighter" />
              )}
              <WorkerStateDot state={session.endState ?? 'active'} />
              <span className="text-sm text-foreground">{session.trigger}</span>
              <span className="text-xs text-foreground-lighter">
                {dayjs(session.startedAt).fromNow()}
              </span>
              {session.endState && (
                <span className="text-xs text-foreground-lighter">
                  · ended {WORKER_STATE_LABELS[session.endState].toLowerCase()}
                </span>
              )}
              <span className="ml-auto text-xs text-foreground-lighter">
                {session.lines.length} {session.lines.length === 1 ? 'line' : 'lines'}
                {requestCount > 0 && ` · ${requestCount} req`}
              </span>
            </button>

            <div className={cn('border-t border-default bg-surface-100', !isOpen && 'hidden')}>
              <WorkerLogFeed logs={session.lines} emptyMessage="No lines in this session" />
            </div>
          </div>
        )
      })}
    </div>
  )
}
