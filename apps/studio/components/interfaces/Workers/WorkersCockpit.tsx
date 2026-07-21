import { useParams } from 'common'
import { ArrowRight, Copy, Lock } from 'lucide-react'
import Link from 'next/link'
import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { toast } from 'sonner'
import { Button, cn, copyToClipboard } from 'ui'

import { LatencyStatTile } from './LatencyStatTile'
import {
  WorkerAccessBadge,
  WorkerActorBadge,
  WorkerRuntimeBadge,
  WorkerStateBadge,
  WorkerStateDot,
} from './WorkerBadges'
import { WorkerLifecycleTimeline } from './WorkerDetail/WorkerLifecycleTimeline'
import { WorkerLogFeed } from './WorkerDetail/WorkerLogFeed'
import type { Worker } from './Workers.types'
import { getWorkerSize, WORKER_ACCESS_MODES, WORKER_REGION } from '@/lib/constants/workers'
import { useInstancesUsed, WORKERS_PROJECT_INSTANCE_CAP } from '@/state/workers-mock-state'

// Derived, deterministic-but-fake request rate — there's no real request-rate
// tracking at alpha. Fine for the mock demo; do not mistake it for real data.
const mockReqPerMin = (worker: Worker) => worker.instances * 380 + worker.id.length * 7

export const WorkersCockpit = ({ workers }: { workers: Worker[] }) => {
  const { ref } = useParams()
  const instancesUsed = useInstancesUsed()
  const [selectedId, setSelectedId] = useState<string>(workers[0]?.id)

  // Keep the selection valid as the fleet mutates (e.g. a worker is deleted).
  useEffect(() => {
    if (!workers.some((w) => w.id === selectedId) && workers[0]) {
      setSelectedId(workers[0].id)
    }
  }, [workers, selectedId])

  const selected = useMemo(
    () => workers.find((w) => w.id === selectedId) ?? workers[0],
    [workers, selectedId]
  )

  if (!selected) return null

  return (
    <div className="grid h-[calc(100vh-220px)] min-h-[560px] grid-cols-1 gap-px overflow-hidden rounded-md border border-default bg-border lg:grid-cols-[280px_1fr_360px]">
      {/* Left: fleet rail */}
      <div className="flex flex-col overflow-y-auto bg-surface-100">
        <div className="flex items-center justify-between border-b border-default px-4 py-3">
          <p className="text-xs uppercase tracking-wide text-foreground-lighter">Fleet</p>
          <InstanceMeter used={instancesUsed} />
        </div>
        {workers.map((worker) => {
          const isActive = worker.id === selected.id
          return (
            <button
              key={worker.id}
              onClick={() => setSelectedId(worker.id)}
              className={cn(
                'flex flex-col gap-1 border-b border-default px-4 py-3 text-left transition-colors',
                isActive ? 'bg-surface-300' : 'hover:bg-surface-200'
              )}
            >
              <div className="flex items-center gap-2">
                <WorkerStateDot state={worker.state} />
                <span className="truncate text-sm text-foreground">{worker.name}</span>
              </div>
              <div className="flex items-center gap-2 pl-4">
                <WorkerRuntimeBadge runtime={worker.runtime} />
                <span className="text-foreground-lighter">·</span>
                <span className="text-xs text-foreground-lighter">
                  {worker.instances} inst
                </span>
              </div>
            </button>
          )
        })}
      </div>

      {/* Center: selected-worker summary */}
      <div className="flex flex-col gap-4 overflow-y-auto bg-studio p-5">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
          <h2 className="text-lg text-foreground">{selected.name}</h2>
          <WorkerStateBadge state={selected.state} />
          <WorkerAccessBadge access={selected.access} />
          <WorkerActorBadge actor={selected.createdBy} />
        </div>

        <EndpointBox worker={selected} />

        <div>
          <p className="mb-2 text-xs uppercase tracking-wide text-foreground-lighter">Lifecycle</p>
          <WorkerLifecycleTimeline lifecycle={selected.lifecycle} compact />
        </div>

        <FactsGrid worker={selected} />

        <LatencyStatTile />

        {/* Post-alpha placeholder: real CPU/memory charts land later. */}
        <div className="rounded-md border border-dashed border-default p-4 text-center">
          <p className="text-xs text-foreground-lighter">
            CPU &amp; memory charts arrive after alpha
          </p>
        </div>

        <Link
          href={`/project/${ref}/workers/${selected.slug}`}
          className="inline-flex items-center gap-1 text-sm text-foreground-light hover:text-foreground"
        >
          Open full detail
          <ArrowRight size={14} />
        </Link>
      </div>

      {/* Right: live log feed */}
      <div className="flex flex-col overflow-hidden bg-surface-100">
        <div className="flex items-center justify-between border-b border-default px-4 py-3">
          <p className="text-xs uppercase tracking-wide text-foreground-lighter">Live logs</p>
          <span className="flex items-center gap-1.5 text-xs text-foreground-lighter">
            <WorkerStateDot state={selected.state} />
            {selected.name}
          </span>
        </div>
        <div className="flex-1 overflow-y-auto">
          <WorkerLogFeed
            logs={selected.logs}
            emptyMessage="Waiting for log lines…"
          />
        </div>
      </div>
    </div>
  )
}

const InstanceMeter = ({ used }: { used: number }) => {
  const pct = Math.min(100, Math.round((used / WORKERS_PROJECT_INSTANCE_CAP) * 100))
  return (
    <span className="flex items-center gap-2 text-xs text-foreground-lighter">
      <span className="h-1 w-16 overflow-hidden rounded-full bg-surface-300">
        <span className="block h-full rounded-full bg-brand" style={{ width: `${pct}%` }} />
      </span>
      {used} / {WORKERS_PROJECT_INSTANCE_CAP}
    </span>
  )
}

const EndpointBox = ({ worker }: { worker: Worker }) => {
  if (worker.access === 'private' || !worker.endpoint) {
    return (
      <div className="rounded-md border border-dashed border-default p-3">
        <p className="text-sm text-foreground-light">No endpoint</p>
        <p className="mt-1 text-xs text-foreground-lighter">
          {WORKER_ACCESS_MODES.private.description}
        </p>
      </div>
    )
  }

  return (
    <div className="rounded-md border border-default bg-surface-100 p-3">
      <div className="flex items-center gap-2">
        <code className="flex-1 truncate text-xs text-foreground">{worker.endpoint}</code>
        <Button
          variant="text"
          size="tiny"
          icon={<Copy />}
          onClick={() => {
            copyToClipboard(worker.endpoint ?? '')
            toast.success('Endpoint copied to clipboard')
          }}
        />
      </div>
      <p className="mt-2 flex items-center gap-1.5 text-xs text-foreground-lighter">
        <Lock size={12} strokeWidth={1.5} />
        Requests must carry a valid Supabase Auth key, validated at the API Gateway.
      </p>
    </div>
  )
}

const FactsGrid = ({ worker }: { worker: Worker }) => {
  const size = getWorkerSize(worker.size)
  return (
    <div className="grid grid-cols-3 gap-px overflow-hidden rounded-md border border-default bg-border">
      <Fact label="Size" value={`${size.memory} · ${size.vcpu}`} />
      <Fact
        label="Region"
        value={WORKER_REGION.short}
        hint={<Lock size={11} strokeWidth={1.5} className="text-foreground-lighter" />}
      />
      <Fact label="Requests/min" value={`~${mockReqPerMin(worker)}`} />
    </div>
  )
}

const Fact = ({
  label,
  value,
  hint,
}: {
  label: string
  value: string
  hint?: ReactNode
}) => (
  <div className="bg-surface-100 p-3">
    <p className="flex items-center gap-1 text-xs uppercase tracking-wide text-foreground-lighter">
      {label} {hint}
    </p>
    <p className="mt-1 text-sm text-foreground">{value}</p>
  </div>
)
