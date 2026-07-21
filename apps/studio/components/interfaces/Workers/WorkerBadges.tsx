import { Bot, Cpu, Layers, MapPin, Terminal, User } from 'lucide-react'
import type { ReactNode } from 'react'
import { cn } from 'ui'

import type { Worker, WorkerActor } from './Workers.types'
import {
  getWorkerRuntime,
  getWorkerSize,
  WORKER_ACCESS_MODES,
  WORKER_REGION,
  WORKER_STATE_LABELS,
  type WorkerAccessMode,
  type WorkerLifecycleState,
  type WorkerRuntimeId,
} from '@/lib/constants/workers'

// Suspended is deliberately a calm grey (healthy-and-cheap), never red. Only a
// genuine fault (`errored`) reads as destructive.
const STATE_DOT_CLASSES: Record<WorkerLifecycleState, string> = {
  deploying: 'bg-warning',
  active: 'bg-brand',
  suspended: 'bg-foreground-muted',
  resuming: 'bg-warning',
  draining: 'bg-warning',
  errored: 'bg-destructive',
  killed: 'bg-foreground-muted',
}

const PULSING_STATES: WorkerLifecycleState[] = ['deploying', 'resuming', 'draining']

export const WorkerStateDot = ({
  state,
  className,
}: {
  state: WorkerLifecycleState
  className?: string
}) => (
  <span className={cn('relative flex h-2 w-2', className)}>
    {PULSING_STATES.includes(state) && (
      <span
        className={cn(
          'absolute inline-flex h-full w-full animate-ping rounded-full opacity-75',
          STATE_DOT_CLASSES[state]
        )}
      />
    )}
    <span className={cn('relative inline-flex h-2 w-2 rounded-full', STATE_DOT_CLASSES[state])} />
  </span>
)

export const WorkerStateBadge = ({ state }: { state: WorkerLifecycleState }) => (
  <span className="inline-flex items-center gap-2 text-xs text-foreground-light">
    <WorkerStateDot state={state} />
    {WORKER_STATE_LABELS[state]}
  </span>
)

export const WorkerRuntimeBadge = ({ runtime }: { runtime: WorkerRuntimeId }) => {
  const def = getWorkerRuntime(runtime)
  return (
    <span className="inline-flex items-center gap-1.5 text-xs text-foreground-light">
      <span className={cn('h-2 w-2 rounded-[2px] bg-current', def.swatch)} />
      {def.label}
    </span>
  )
}

export const WorkerAccessBadge = ({ access }: { access: WorkerAccessMode }) => (
  <span
    className={cn(
      'inline-flex items-center rounded-full border px-2 py-0.5 text-xs',
      access === 'public'
        ? 'border-brand-500 text-brand'
        : 'border-default text-foreground-light'
    )}
  >
    {WORKER_ACCESS_MODES[access].label}
  </span>
)

const MetaItem = ({ icon: Icon, children }: { icon: typeof Cpu; children: ReactNode }) => (
  <span className="inline-flex items-center gap-1.5 text-xs text-foreground-light">
    <Icon size={12} strokeWidth={1.5} className="text-foreground-lighter" />
    {children}
  </span>
)

/** Read-only config summary shown as badges under the worker name. */
export const WorkerConfigBadges = ({ worker }: { worker: Worker }) => {
  const size = getWorkerSize(worker.size)
  return (
    <>
      <MetaItem icon={Cpu}>
        {size.vcpu} · {size.memory}
      </MetaItem>
      <MetaItem icon={MapPin}>
        {WORKER_REGION.short} <span className="text-foreground-lighter">(locked)</span>
      </MetaItem>
      <MetaItem icon={Layers}>
        {worker.instances} {worker.instances === 1 ? 'instance' : 'instances'}
      </MetaItem>
    </>
  )
}

export const WorkerActorBadge = ({ actor }: { actor: WorkerActor }) => {
  const Icon = actor.type === 'user' ? User : actor.type === 'cli' ? Terminal : Bot
  return (
    <span className="inline-flex items-center gap-1.5 text-xs text-foreground-lighter">
      <Icon size={12} strokeWidth={1.5} />
      {actor.name}
    </span>
  )
}
