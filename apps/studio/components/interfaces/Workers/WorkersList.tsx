import { useParams } from 'common'
import { ChevronRight, Loader2, MoreVertical, Pause, Play, Plus, Trash2, Zap } from 'lucide-react'
import { useRouter } from 'next/router'
import { parseAsString, useQueryState } from 'nuqs'
import { useMemo, useState } from 'react'
import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from 'ui'
import { Input } from 'ui-patterns/DataInputs/Input'

import { DeleteWorkerModal } from './WorkerDetail/DeleteWorkerModal'
import {
  WorkerAccessBadge,
  WorkerRuntimeBadge,
  WorkerStateBadge,
} from './WorkerBadges'
import type { Worker } from './Workers.types'
import {
  getWorkerSize,
  WORKER_ACCESS_MODES,
  WORKER_REGION,
  WORKER_STATE_LABELS,
  type WorkerLifecycleState,
} from '@/lib/constants/workers'
import { workersMockState } from '@/state/workers-mock-state'

const FILTERABLE_STATES: WorkerLifecycleState[] = [
  'active',
  'suspended',
  'deploying',
  'resuming',
  'draining',
  'errored',
]

const TRANSITIONAL_STATES: WorkerLifecycleState[] = ['deploying', 'resuming', 'draining']

export const WorkersList = ({
  workers,
  onCreate,
}: {
  workers: Worker[]
  onCreate: () => void
}) => {
  const router = useRouter()
  const { ref } = useParams()

  const [search, setSearch] = useQueryState('search', parseAsString.withDefault(''))
  const [stateFilter, setStateFilter] = useQueryState('state', parseAsString.withDefault('all'))
  const [accessFilter, setAccessFilter] = useQueryState('access', parseAsString.withDefault('all'))

  const [pendingDelete, setPendingDelete] = useState<Worker | undefined>(undefined)

  const filtered = useMemo(() => {
    return workers.filter((worker) => {
      if (search && !worker.name.toLowerCase().includes(search.toLowerCase())) return false
      if (stateFilter !== 'all' && worker.state !== stateFilter) return false
      if (accessFilter !== 'all' && worker.access !== accessFilter) return false
      return true
    })
  }, [workers, search, stateFilter, accessFilter])

  const openWorker = (worker: Worker) => router.push(`/project/${ref}/workers/${worker.slug}`)

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-2">
        <Input
          size="tiny"
          className="w-full md:w-64"
          placeholder="Search by name"
          value={search}
          onChange={(event) => setSearch(event.target.value || null)}
        />

        <Select value={stateFilter} onValueChange={(value) => setStateFilter(value)}>
          <SelectTrigger size="tiny" className="w-40">
            <SelectValue placeholder="State" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All states</SelectItem>
            {FILTERABLE_STATES.map((state) => (
              <SelectItem key={state} value={state}>
                {WORKER_STATE_LABELS[state]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={accessFilter} onValueChange={(value) => setAccessFilter(value)}>
          <SelectTrigger size="tiny" className="w-40">
            <SelectValue placeholder="Access" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All access</SelectItem>
            {Object.values(WORKER_ACCESS_MODES).map((mode) => (
              <SelectItem key={mode.id} value={mode.id}>
                {mode.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <span className="ml-auto text-xs text-foreground-light">
          {filtered.length === workers.length
            ? `${workers.length} ${workers.length === 1 ? 'worker' : 'workers'}`
            : `${filtered.length} of ${workers.length} workers`}
        </span>

        <Button icon={<Plus />} onClick={onCreate}>
          Create worker
        </Button>
      </div>

      <div className="overflow-hidden rounded-md border border-default">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead className="w-36">State</TableHead>
              <TableHead className="w-40">Runtime</TableHead>
              <TableHead className="w-28">Access</TableHead>
              <TableHead className="w-24">Region</TableHead>
              <TableHead>Resources</TableHead>
              <TableHead className="w-40" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7}>
                  <p className="text-sm text-foreground">No workers found</p>
                  <p className="text-sm text-foreground-light">
                    Try adjusting your search or filters.
                  </p>
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((worker) => {
                const size = getWorkerSize(worker.size)
                return (
                  <TableRow
                    key={worker.id}
                    className="cursor-pointer"
                    onClick={() => openWorker(worker)}
                  >
                    <TableCell className="font-medium text-foreground">{worker.name}</TableCell>
                    <TableCell>
                      <WorkerStateBadge state={worker.state} />
                    </TableCell>
                    <TableCell>
                      <WorkerRuntimeBadge runtime={worker.runtime} />
                    </TableCell>
                    <TableCell>
                      <WorkerAccessBadge access={worker.access} />
                    </TableCell>
                    <TableCell className="text-sm text-foreground-light">
                      {WORKER_REGION.short}
                    </TableCell>
                    <TableCell className="text-sm text-foreground-light">
                      <span className="tabular-nums">
                        {size.vcpu} · {size.memory} · {worker.instances} inst
                      </span>
                    </TableCell>
                    <TableCell onClick={(event) => event.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1">
                        <StartStopButton worker={worker} />
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="text" size="tiny" icon={<MoreVertical />} />
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-44">
                            <DropdownMenuItem onClick={() => openWorker(worker)}>
                              <ChevronRight size={14} className="mr-2" /> Open detail
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              disabled={worker.state === 'killed'}
                              onClick={() => workersMockState.simulateTraffic(worker.id)}
                            >
                              <Zap size={14} className="mr-2" /> Simulate traffic
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-destructive focus:text-destructive"
                              onClick={() => setPendingDelete(worker)}
                            >
                              <Trash2 size={14} className="mr-2" /> Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
      </div>

      {pendingDelete && (
        <DeleteWorkerModal
          worker={pendingDelete}
          visible={!!pendingDelete}
          onCancel={() => setPendingDelete(undefined)}
          onConfirm={() => {
            workersMockState.deleteWorker(pendingDelete.id)
            setPendingDelete(undefined)
          }}
        />
      )}
    </div>
  )
}

const StartStopButton = ({ worker }: { worker: Worker }) => {
  if (TRANSITIONAL_STATES.includes(worker.state)) {
    return (
      <Button variant="text" size="tiny" disabled icon={<Loader2 className="animate-spin" />} />
    )
  }

  if (worker.state === 'active') {
    return (
      <Button
        variant="text"
        size="tiny"
        icon={<Pause />}
        title="Suspend"
        onClick={() => workersMockState.suspendWorker(worker.id)}
      />
    )
  }

  if (worker.state === 'suspended' || worker.state === 'errored') {
    return (
      <Button
        variant="text"
        size="tiny"
        icon={<Play />}
        title={worker.state === 'errored' ? 'Restart' : 'Start'}
        onClick={() => workersMockState.resumeWorker(worker.id)}
      />
    )
  }

  return null
}
