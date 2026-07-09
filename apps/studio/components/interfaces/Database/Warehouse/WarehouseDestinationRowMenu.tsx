import { useParams } from 'common'
import { Edit, MoreVertical, Pause, Play, RotateCcw, Trash } from 'lucide-react'
import { parseAsBoolean, useQueryState } from 'nuqs'
import { toast } from 'sonner'
import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from 'ui'

import type { ReplicationPhase, WarehousePipelineStatus } from './warehouseDemoStore'
import {
  restartWarehousePipeline,
  startWarehousePipeline,
  stopWarehousePipeline,
} from './warehouseDemoStore'

interface WarehouseDestinationRowMenuProps {
  replicationPhase: ReplicationPhase
  pipelineStatus: WarehousePipelineStatus
  onDeleteClick: () => void
}

export function WarehouseDestinationRowMenu({
  replicationPhase,
  pipelineStatus,
  onDeleteClick,
}: WarehouseDestinationRowMenuProps) {
  const { ref: projectRef } = useParams()
  const [, setShowManage] = useQueryState('warehouseManage', parseAsBoolean.withDefault(false))

  const isTransitional = replicationPhase === 'provisioning' || replicationPhase === 'backfilling'
  const isStreaming = replicationPhase === 'streaming'
  const isFailed = replicationPhase === 'failed'
  const isRunning = pipelineStatus === 'running'
  const isStopped = pipelineStatus === 'stopped'

  const showStopAndRestart = !isTransitional && isStreaming && isRunning
  const showStart = !isTransitional && isStreaming && isStopped
  const showFailedActions = isFailed

  const onRestartPipeline = () => {
    if (!projectRef) return
    restartWarehousePipeline(projectRef)
    toast.success('Warehouse pipeline restarted')
  }

  const onStopPipeline = () => {
    if (!projectRef) return
    stopWarehousePipeline(projectRef)
    toast.success('Warehouse pipeline stopped')
  }

  const onStartPipeline = () => {
    if (!projectRef) return
    startWarehousePipeline(projectRef)
    toast.success('Warehouse pipeline started')
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="default" className="px-1.5" icon={<MoreVertical />} />
      </DropdownMenuTrigger>

      <DropdownMenuContent side="bottom" align="end" className="w-52">
        {(showStopAndRestart || showFailedActions) && (
          <>
            <DropdownMenuItem className="space-x-2" onClick={onRestartPipeline}>
              <RotateCcw size={14} />
              <p>Restart pipeline</p>
            </DropdownMenuItem>
            {showStopAndRestart && (
              <DropdownMenuItem className="space-x-2" onClick={onStopPipeline}>
                <Pause size={14} />
                <p>Stop pipeline</p>
              </DropdownMenuItem>
            )}
            <DropdownMenuSeparator />
          </>
        )}
        {showStart && (
          <>
            <DropdownMenuItem className="space-x-2" onClick={onStartPipeline}>
              <Play size={14} />
              <p>Start pipeline</p>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
          </>
        )}

        <DropdownMenuItem className="space-x-2" onClick={() => setShowManage(true)}>
          <Edit size={14} />
          <p>Edit destination</p>
        </DropdownMenuItem>
        <DropdownMenuItem className="space-x-2" onClick={onDeleteClick}>
          <Trash size={14} />
          <p>Delete destination</p>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
