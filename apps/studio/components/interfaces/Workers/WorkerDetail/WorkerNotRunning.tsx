import { Loader2, Play, PowerOff } from 'lucide-react'
import { Button } from 'ui'

import type { Worker } from '../Workers.types'
import { WORKER_STATE_LABELS, type WorkerLifecycleState } from '@/lib/constants/workers'
import { workersMockState } from '@/state/workers-mock-state'

const TRANSITIONAL_STATES: WorkerLifecycleState[] = ['deploying', 'resuming', 'draining']

/**
 * Shown on tabs that need a live worker (Terminal, Filesystem) when the worker
 * isn't running. Explains why and offers a start CTA — unless the worker is
 * already coming up, in which case it shows a spinner.
 */
export const WorkerNotRunning = ({ worker, feature }: { worker: Worker; feature: string }) => {
  const isTransitional = TRANSITIONAL_STATES.includes(worker.state)
  const canStart = worker.state === 'suspended' || worker.state === 'errored'

  return (
    <div className="flex flex-1 items-center justify-center py-24">
      <div className="flex max-w-md flex-col items-center text-center">
        <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-full border border-default bg-surface-100">
          {isTransitional ? (
            <Loader2 size={18} className="animate-spin text-foreground-light" />
          ) : (
            <PowerOff size={18} strokeWidth={1.5} className="text-foreground-light" />
          )}
        </div>

        <h3 className="text-base text-foreground">
          {isTransitional ? `Worker is ${WORKER_STATE_LABELS[worker.state].toLowerCase()}` : 'Worker is not running'}
        </h3>

        <p className="mt-1 text-sm text-foreground-light">
          {isTransitional
            ? `Hang tight — the ${feature} will be available once the worker is active.`
            : `The ${feature} needs a running worker. Workers scale to zero while idle, so start it to open a live session — this doesn't affect billing at alpha.`}
        </p>

        {canStart && (
          <Button
            className="mt-4"
            icon={<Play />}
            onClick={() => workersMockState.resumeWorker(worker.id)}
          >
            {worker.state === 'errored' ? 'Restart worker' : 'Start worker'}
          </Button>
        )}
      </div>
    </div>
  )
}
