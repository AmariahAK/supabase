import { useParams } from 'common'
import dayjs from 'dayjs'
import { useRouter } from 'next/router'
import { useState, type ReactNode } from 'react'
import { toast } from 'sonner'
import { Button } from 'ui'

import { DeleteWorkerModal } from './DeleteWorkerModal'
import { WorkerAccessBadge, WorkerActorBadge, WorkerRuntimeBadge } from '../WorkerBadges'
import type { Worker } from '../Workers.types'
import { ConstrainedIntegrationTabScaffold } from '@/components/interfaces/Integrations/ConstrainedIntegrationTabScaffold'
import {
  getWorkerSize,
  UNIT_NAME_LOWER,
  WORKER_REGION,
  WORKER_SIZE_GUIDANCE,
  type WorkerRuntimeId,
} from '@/lib/constants/workers'
import { workersMockState } from '@/state/workers-mock-state'

const BASE_IMAGES: Record<WorkerRuntimeId, string> = {
  node: 'node:24-slim',
  deno: 'denoland/deno:2.9',
  bun: 'oven/bun:latest',
  python: 'python:3.14-slim',
  dockerfile: 'Your Dockerfile',
}

const ENTRYPOINTS: Record<WorkerRuntimeId, string> = {
  node: 'node index.js',
  deno: 'deno run --allow-net main.ts',
  bun: 'bun run index.ts',
  python: 'python main.py',
  dockerfile: 'CMD from Dockerfile',
}

const Fact = ({ label, children }: { label: string; children: ReactNode }) => (
  <div className="flex items-start justify-between gap-4 border-b border-default py-3 last:border-b-0">
    <p className="text-sm text-foreground-light">{label}</p>
    <div className="text-right text-sm text-foreground">{children}</div>
  </div>
)

export const WorkerContainerTab = ({ worker }: { worker: Worker }) => {
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
    <ConstrainedIntegrationTabScaffold>
      <div className="mx-auto grid w-full max-w-6xl grid-cols-1 items-start gap-10 @4xl:grid-cols-[minmax(0,760px)_240px]">
        <div className="flex min-w-0 flex-col gap-8">
          <section>
            <h3 className="text-sm text-foreground">Container</h3>
            <p className="mt-1 text-sm text-foreground-light">{WORKER_SIZE_GUIDANCE}</p>
            <div className="mt-4 rounded-md border border-default bg-surface-100 px-4">
              <Fact label="Runtime">
                <WorkerRuntimeBadge runtime={worker.runtime} />
              </Fact>
              <Fact label="Base image">
                <code className="text-xs text-foreground">{BASE_IMAGES[worker.runtime]}</code>
              </Fact>
              <Fact label="Entrypoint">
                <code className="text-xs text-foreground">{ENTRYPOINTS[worker.runtime]}</code>
              </Fact>
              <Fact label="Listening port">
                <code className="text-xs text-foreground">$PORT → 8080</code>
              </Fact>
            </div>
          </section>

          <section>
            <h3 className="text-sm text-foreground">Resources</h3>
            <div className="mt-4 rounded-md border border-default bg-surface-100 px-4">
              <Fact label="Size">
                {size.label} · {size.memory} · {size.vcpu}
              </Fact>
              <Fact label="Instances">{worker.instances}</Fact>
              <Fact label="Access">
                <WorkerAccessBadge access={worker.access} />
              </Fact>
              <Fact label="Region">
                {WORKER_REGION.label} <span className="text-foreground-lighter">(locked)</span>
              </Fact>
              <Fact label="Created">
                <span className="flex items-center justify-end gap-2">
                  {dayjs(worker.createdAt).format('MMM D, YYYY HH:mm')}
                  <WorkerActorBadge actor={worker.createdBy} />
                </span>
              </Fact>
            </div>
          </section>
        </div>

        {/* Rail: danger zone */}
        <aside className="flex flex-col gap-4">
          <div className="rounded-md border border-destructive-400 bg-destructive-200/30 p-4">
            <h3 className="text-sm text-foreground">Delete {UNIT_NAME_LOWER}</h3>
            <p className="mt-1 text-sm text-foreground-light">
              No resize at alpha — to change the container, delete and redeploy. Deleting frees its
              instances back to the project cap.
            </p>
            <Button variant="danger" className="mt-3" onClick={() => setShowDelete(true)}>
              Delete {UNIT_NAME_LOWER}
            </Button>
          </div>
        </aside>
      </div>

      <DeleteWorkerModal
        worker={worker}
        visible={showDelete}
        onCancel={() => setShowDelete(false)}
        onConfirm={handleDelete}
      />
    </ConstrainedIntegrationTabScaffold>
  )
}
