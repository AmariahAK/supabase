import { useState } from 'react'
import { Switch } from 'ui'
import { PageContainer } from 'ui-patterns/PageContainer'
import {
  PageSection,
  PageSectionAside,
  PageSectionContent,
  PageSectionMeta,
  PageSectionSummary,
  PageSectionTitle,
} from 'ui-patterns/PageSection'

import { WorkerLifecycleTimeline } from './WorkerLifecycleTimeline'
import { WorkerLogFeed } from './WorkerLogFeed'
import type { Worker } from '../Workers.types'
import { LOG_DESTINATION } from '@/lib/constants/workers'

export const WorkerLogsTab = ({ worker }: { worker: Worker }) => {
  const [showLifecycle, setShowLifecycle] = useState(true)

  return (
    <PageContainer size="large">
      <PageSection>
        <PageSectionMeta>
          <PageSectionSummary>
            <PageSectionTitle>Lifecycle history</PageSectionTitle>
          </PageSectionSummary>
        </PageSectionMeta>
        <PageSectionContent>
          <div className="rounded-md border border-default bg-surface-100 p-4">
            <WorkerLifecycleTimeline lifecycle={worker.lifecycle} />
          </div>
        </PageSectionContent>
      </PageSection>

      <PageSection>
        <PageSectionMeta>
          <PageSectionSummary>
            <PageSectionTitle>Logs</PageSectionTitle>
          </PageSectionSummary>
          <PageSectionAside>
            <Switch
              id="worker-logs-interleave"
              checked={showLifecycle}
              onCheckedChange={setShowLifecycle}
            />
            <label htmlFor="worker-logs-interleave" className="text-xs text-foreground-light">
              Interleave lifecycle events
            </label>
          </PageSectionAside>
        </PageSectionMeta>
        <PageSectionContent>
          <p className="mb-3 text-sm text-foreground-light">
            Streaming from {LOG_DESTINATION}, tagged with this worker's id.
          </p>
          <div className="overflow-hidden rounded-md border border-default bg-surface-100">
            <WorkerLogFeed logs={worker.logs} showLifecycle={showLifecycle} />
          </div>
        </PageSectionContent>
      </PageSection>
    </PageContainer>
  )
}
