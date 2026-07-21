import { useMemo, useState, type ReactNode } from 'react'
import { toast } from 'sonner'
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogSection,
  DialogSectionSeparator,
  DialogTitle,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from 'ui'
import { CodeBlock } from 'ui-patterns/CodeBlock'
import { Input } from 'ui-patterns/DataInputs/Input'

import {
  getWorkerRuntime,
  UNIT_NAME,
  UNIT_NAME_LOWER,
  WORKER_ACCESS_MODES,
  WORKER_INSTANCE_LIMITS,
  WORKER_RUNTIMES,
  WORKER_SIZES,
  type WorkerAccessMode,
  type WorkerRuntimeId,
  type WorkerSizeId,
} from '@/lib/constants/workers'
import { generateWorkerName, workersMockState } from '@/state/workers-mock-state'
import type { Worker } from './Workers.types'

const Field = ({
  label,
  htmlFor,
  children,
}: {
  label: string
  htmlFor?: string
  children: ReactNode
}) => (
  <div className="flex flex-col gap-2">
    <label htmlFor={htmlFor} className="text-sm text-foreground-light">
      {label}
    </label>
    {children}
  </div>
)

export const CreateWorkerDialog = ({
  visible,
  onClose,
  onCreated,
}: {
  visible: boolean
  onClose: () => void
  onCreated?: (worker: Worker) => void
}) => {
  const [name, setName] = useState(() => generateWorkerName())
  const [runtime, setRuntime] = useState<WorkerRuntimeId>('node')
  const [size, setSize] = useState<WorkerSizeId>('2x1')
  const [access, setAccess] = useState<WorkerAccessMode>('public')
  const [instances, setInstances] = useState(WORKER_INSTANCE_LIMITS.default)

  const command = useMemo(() => {
    const runtimeValue = getWorkerRuntime(runtime).cliValue
    return [
      `supabase workers deploy ${name || 'my-worker'} \\`,
      `  --runtime ${runtimeValue} \\`,
      `  --size ${size} \\`,
      `  --access ${access} \\`,
      `  --instances ${instances}`,
    ].join('\n')
  }, [name, runtime, size, access, instances])

  const handleCreate = () => {
    const worker = workersMockState.createWorker({ name, runtime, size, access, instances })
    toast.success(`Deploying ${UNIT_NAME_LOWER} "${worker.name}"`)
    onCreated?.(worker)
    onClose()
  }

  return (
    <Dialog open={visible} onOpenChange={(open) => !open && onClose()}>
      <DialogContent size="large" onOpenAutoFocus={(event) => event.preventDefault()}>
        <DialogHeader>
          <DialogTitle>Create {UNIT_NAME}</DialogTitle>
          <DialogDescription>
            {UNIT_NAME}s are deployed from the CLI. Copy the command below, or spin up a mock{' '}
            {UNIT_NAME_LOWER} to preview how it appears here.
          </DialogDescription>
        </DialogHeader>

        <DialogSectionSeparator />

        <DialogSection className="flex flex-col gap-4">
          <Field label="Name" htmlFor="worker-name">
            <Input
              id="worker-name"
              value={name}
              onChange={(event) => setName(event.target.value)}
            />
          </Field>

          <Field label="Runtime">
            <Select value={runtime} onValueChange={(value) => setRuntime(value as WorkerRuntimeId)}>
              <SelectTrigger>
                <SelectValue placeholder="Select a runtime" />
              </SelectTrigger>
              <SelectContent>
                {WORKER_RUNTIMES.map((option) => (
                  <SelectItem key={option.id} value={option.id}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <Field label="Size">
              <Select value={size} onValueChange={(value) => setSize(value as WorkerSizeId)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a size" />
                </SelectTrigger>
                <SelectContent>
                  {WORKER_SIZES.map((option) => (
                    <SelectItem key={option.id} value={option.id}>
                      {option.label} · {option.memory} · {option.vcpu}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>

            <Field label="Access">
              <Select
                value={access}
                onValueChange={(value) => setAccess(value as WorkerAccessMode)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select access" />
                </SelectTrigger>
                <SelectContent>
                  {Object.values(WORKER_ACCESS_MODES).map((option) => (
                    <SelectItem key={option.id} value={option.id}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>

            <Field label="Instances" htmlFor="worker-instances">
              <Input
                id="worker-instances"
                type="number"
                min={WORKER_INSTANCE_LIMITS.min}
                max={WORKER_INSTANCE_LIMITS.max}
                value={String(instances)}
                onChange={(event) => {
                  const next = Number(event.target.value)
                  if (Number.isNaN(next)) return
                  setInstances(
                    Math.min(WORKER_INSTANCE_LIMITS.max, Math.max(WORKER_INSTANCE_LIMITS.min, next))
                  )
                }}
              />
            </Field>
          </div>

          <Field label="Deploy command">
            <CodeBlock language="bash" hideLineNumbers className="text-xs">
              {command}
            </CodeBlock>
          </Field>
        </DialogSection>

        <DialogFooter>
          <Button variant="default" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleCreate}>Create {UNIT_NAME_LOWER}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
