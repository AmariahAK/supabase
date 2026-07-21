import { useState } from 'react'
import { Switch } from 'ui'

import { WorkerLifecycleTimeline } from './WorkerLifecycleTimeline'
import { WorkerLogFeed } from './WorkerLogFeed'
import type { Worker } from '../Workers.types'
import { LOG_DESTINATION } from '@/lib/constants/workers'

export const WorkerLogsTab = ({ worker }: { worker: Worker }) => {
  const [showLifecycle, setShowLifecycle] = useState(true)

  return (
    <div className="flex flex-col gap-4 p-4">
      <div className="rounded-md border border-default bg-surface-100 p-4">
        <p className="mb-3 text-xs uppercase tracking-wide text-foreground-lighter">
          Lifecycle history
        </p>
        <WorkerLifecycleTimeline lifecycle={worker.lifecycle} />
      </div>

      <div className="flex items-center justify-between">
        <p className="text-sm text-foreground-light">
          Streaming from {LOG_DESTINATION}, tagged with this worker's id.
        </p>
        <div className="flex items-center gap-2">
          <Switch
            id="worker-logs-interleave"
            checked={showLifecycle}
            onCheckedChange={setShowLifecycle}
          />
          <label htmlFor="worker-logs-interleave" className="text-xs text-foreground-light">
            Interleave lifecycle events
          </label>
        </div>
      </div>

      <div className="overflow-hidden rounded-md border border-default bg-surface-100">
        <WorkerLogFeed logs={worker.logs} showLifecycle={showLifecycle} />
      </div>
    </div>
  )
}
