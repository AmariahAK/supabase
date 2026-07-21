import { Loader2, Pause, Play, RotateCcw, Zap } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from 'ui'

import type { Worker } from './Workers.types'
import { WORKER_STATE_LABELS, type WorkerLifecycleState } from '@/lib/constants/workers'
import { workersMockState } from '@/state/workers-mock-state'

const TRANSITIONAL_STATES: WorkerLifecycleState[] = ['deploying', 'resuming', 'draining']

/** True when the worker is up and can serve traffic / accept a shell. */
export const isWorkerRunning = (worker: Worker) => worker.state === 'active'

/** Start / suspend / restart control, mirrors the state machine. */
export const WorkerStartStopButton = ({ worker }: { worker: Worker }) => {
  if (TRANSITIONAL_STATES.includes(worker.state)) {
    return (
      <Button variant="default" disabled icon={<Loader2 className="animate-spin" />}>
        {WORKER_STATE_LABELS[worker.state]}
      </Button>
    )
  }

  if (worker.state === 'active') {
    return (
      <Button
        variant="default"
        icon={<Pause />}
        onClick={() => workersMockState.suspendWorker(worker.id)}
      >
        Suspend
      </Button>
    )
  }

  if (worker.state === 'suspended') {
    return (
      <Button
        variant="default"
        icon={<Play />}
        onClick={() => workersMockState.resumeWorker(worker.id)}
      >
        Start
      </Button>
    )
  }

  if (worker.state === 'errored') {
    return (
      <Button
        variant="default"
        icon={<RotateCcw />}
        onClick={() => workersMockState.resumeWorker(worker.id)}
      >
        Restart
      </Button>
    )
  }

  return null
}

export const WorkerActions = ({ worker }: { worker: Worker }) => {
  return (
    <>
      {worker.state !== 'killed' && worker.state !== 'deploying' && (
        <Button
          variant="text"
          icon={<Zap />}
          onClick={() => {
            workersMockState.simulateTraffic(worker.id)
            toast.success('Simulated traffic sent')
          }}
        >
          Simulate traffic
        </Button>
      )}
      <WorkerStartStopButton worker={worker} />
    </>
  )
}
