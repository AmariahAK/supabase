import { useParams } from 'common'
import { ExternalLink, Telescope } from 'lucide-react'
import Link from 'next/link'
import { Button } from 'ui'

import { WorkerLogSessions } from './WorkerLogSessions'
import type { Worker } from '../Workers.types'
import { ConstrainedIntegrationTabScaffold } from '@/components/interfaces/Integrations/ConstrainedIntegrationTabScaffold'
import { LOG_DESTINATION } from '@/lib/constants/workers'

export const WorkerLogsTab = ({ worker }: { worker: Worker }) => {
  const { ref } = useParams()

  return (
    <ConstrainedIntegrationTabScaffold>
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h3 className="text-sm text-foreground">Sessions</h3>
            <p className="mt-1 text-sm text-foreground-light">
              Each run is grouped as a session — a new group starts whenever the worker deploys or
              resumes, and lifecycle events show inline in the stream. Full history streams to{' '}
              {LOG_DESTINATION}.
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-2">
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
    </ConstrainedIntegrationTabScaffold>
  )
}
