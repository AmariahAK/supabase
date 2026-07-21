import { useParams } from 'common'
import { ExternalLink, Telescope } from 'lucide-react'
import Link from 'next/link'
import { Button } from 'ui'
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
import { WorkerLogSessions } from './WorkerLogSessions'
import type { Worker } from '../Workers.types'
import { LOG_DESTINATION } from '@/lib/constants/workers'

export const WorkerLogsTab = ({ worker }: { worker: Worker }) => {
  const { ref } = useParams()

  return (
    <PageContainer size="large">
      <PageSection>
        <PageSectionMeta>
          <PageSectionSummary>
            <PageSectionTitle>Lifecycle</PageSectionTitle>
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
            <PageSectionTitle>Sessions</PageSectionTitle>
          </PageSectionSummary>
          <PageSectionAside>
            <Button asChild variant="default" icon={<ExternalLink />}>
              <Link href={`/project/${ref}/logs/explorer?q=${worker.slug}`}>Open in Logs</Link>
            </Button>
            <Button asChild variant="default" icon={<Telescope />}>
              <Link href={`/project/${ref}/observability`}>Observability</Link>
            </Button>
          </PageSectionAside>
        </PageSectionMeta>
        <PageSectionContent>
          <p className="mb-3 text-sm text-foreground-light">
            Each run is grouped as a session — a new group starts whenever the worker deploys or
            resumes. Full history streams to {LOG_DESTINATION}; open it in Logs for deeper filtering.
          </p>
          <WorkerLogSessions worker={worker} />
        </PageSectionContent>
      </PageSection>
    </PageContainer>
  )
}
