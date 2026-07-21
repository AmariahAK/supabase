import { useParams } from 'common'
import { ExternalLink, Telescope } from 'lucide-react'
import Link from 'next/link'
import { Button } from 'ui'
import { PageContainer } from 'ui-patterns/PageContainer'

import { WorkerLifecycleTimeline } from './WorkerLifecycleTimeline'
import { WorkerLogSessions } from './WorkerLogSessions'
import type { Worker } from '../Workers.types'
import { LOG_DESTINATION } from '@/lib/constants/workers'

export const WorkerLogsTab = ({ worker }: { worker: Worker }) => {
  const { ref } = useParams()

  return (
    <PageContainer size="full" className="py-6 xl:py-8">
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-4">
        {/* Left rail (1/4): lifecycle, stacked vertically */}
        <aside className="lg:col-span-1">
          <h3 className="mb-4 text-sm text-foreground">Lifecycle</h3>
          <WorkerLifecycleTimeline lifecycle={worker.lifecycle} orientation="vertical" />
        </aside>

        {/* Main (3/4): sessions */}
        <div className="lg:col-span-3">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
            <div>
              <h3 className="text-sm text-foreground">Sessions</h3>
              <p className="mt-1 text-sm text-foreground-light">
                Each run is grouped as a session — a new group starts whenever the worker deploys or
                resumes. Full history streams to {LOG_DESTINATION}.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button asChild variant="default" icon={<ExternalLink />}>
                <Link href={`/project/${ref}/logs/explorer?q=${worker.slug}`}>Open in Logs</Link>
              </Button>
              <Button asChild variant="default" icon={<Telescope />}>
                <Link href={`/project/${ref}/observability`}>Observability</Link>
              </Button>
            </div>
          </div>
          <WorkerLogSessions worker={worker} />
        </div>
      </div>
    </PageContainer>
  )
}
