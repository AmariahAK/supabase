import { useParams } from 'common'
import dayjs from 'dayjs'
import { useRouter } from 'next/router'
import { useState, type ReactNode } from 'react'
import { toast } from 'sonner'
import { Button } from 'ui'
import { PageContainer } from 'ui-patterns/PageContainer'
import {
  PageSection,
  PageSectionContent,
  PageSectionMeta,
  PageSectionSummary,
  PageSectionTitle,
} from 'ui-patterns/PageSection'

import { DeleteWorkerModal } from './DeleteWorkerModal'
import { WorkerAccessBadge, WorkerActorBadge, WorkerRuntimeBadge } from '../WorkerBadges'
import type { Worker } from '../Workers.types'
import {
  getWorkerSize,
  NOT_AVAILABLE_AT_ALPHA,
  UNIT_NAME_LOWER,
  WORKER_REGION,
  WORKER_SIZE_GUIDANCE,
} from '@/lib/constants/workers'
import { workersMockState } from '@/state/workers-mock-state'

const Fact = ({ label, children }: { label: string; children: ReactNode }) => (
  <div className="flex flex-col gap-1 border-b border-default py-3">
    <p className="text-xs uppercase tracking-wide text-foreground-lighter">{label}</p>
    <div className="text-sm text-foreground">{children}</div>
  </div>
)

export const WorkerSettingsTab = ({ worker }: { worker: Worker }) => {
  const router = useRouter()
  const { ref } = useParams()
  const [showDelete, setShowDelete] = useState(false)

  const size = getWorkerSize(worker.size)

  const handleDelete = () => {
    workersMockState.deleteWorker(worker.id)
    setShowDelete(false)
    toast.success(`Deleted ${UNIT_NAME_LOWER} "${worker.name}"`)
    router.push(`/project/${ref}/workers`)
  }

  return (
    <PageContainer size="large">
      <PageSection>
        <PageSectionMeta>
          <PageSectionSummary>
            <PageSectionTitle>Configuration</PageSectionTitle>
          </PageSectionSummary>
        </PageSectionMeta>
        <PageSectionContent>
          <p className="mb-4 text-xs text-foreground-lighter">{WORKER_SIZE_GUIDANCE}</p>
          <div className="grid grid-cols-1 gap-x-8 md:grid-cols-2">
            <Fact label="Runtime">
              <WorkerRuntimeBadge runtime={worker.runtime} />
            </Fact>
            <Fact label="Access">
              <WorkerAccessBadge access={worker.access} />
            </Fact>
            <Fact label="Size">
              {size.label} · {size.memory} · {size.vcpu}
            </Fact>
            <Fact label="Instances">{worker.instances}</Fact>
            <Fact label="Region">
              {WORKER_REGION.label} <span className="text-foreground-lighter">(locked)</span>
            </Fact>
            <Fact label="Created">
              <span className="flex items-center gap-2">
                {dayjs(worker.createdAt).format('MMM D, YYYY HH:mm')}
                <WorkerActorBadge actor={worker.createdBy} />
              </span>
            </Fact>
          </div>
        </PageSectionContent>
      </PageSection>

      <PageSection>
        <PageSectionMeta>
          <PageSectionSummary>
            <PageSectionTitle>Not available at alpha</PageSectionTitle>
          </PageSectionSummary>
        </PageSectionMeta>
        <PageSectionContent>
          <ul className="grid grid-cols-1 gap-1 text-sm text-foreground-lighter md:grid-cols-2">
            {NOT_AVAILABLE_AT_ALPHA.map((item) => (
              <li key={item} className="flex items-center gap-2">
                <span className="h-1 w-1 rounded-full bg-foreground-muted" aria-hidden />
                {item}
              </li>
            ))}
          </ul>
        </PageSectionContent>
      </PageSection>

      <PageSection>
        <PageSectionContent>
          <div className="rounded-md border border-destructive-400 bg-destructive-200/30 p-4">
            <h3 className="text-sm text-foreground">Delete this {UNIT_NAME_LOWER}</h3>
            <p className="mt-1 max-w-xl text-sm text-foreground-light">
              There is no resize at alpha — to change size or runtime, delete this {UNIT_NAME_LOWER}{' '}
              and redeploy from the CLI. Deleting frees its instances back to the project cap.
            </p>
            <Button variant="danger" className="mt-3" onClick={() => setShowDelete(true)}>
              Delete {UNIT_NAME_LOWER}
            </Button>
          </div>
        </PageSectionContent>
      </PageSection>

      <DeleteWorkerModal
        worker={worker}
        visible={showDelete}
        onCancel={() => setShowDelete(false)}
        onConfirm={handleDelete}
      />
    </PageContainer>
  )
}
