import { useParams } from 'common'
import { Database, Minus } from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'
import { Button, TableCell, TableRow, Tooltip, TooltipContent, TooltipTrigger } from 'ui'

import { DeleteDestination } from '../Replication/DeleteDestination'
import { MANAGED_WAREHOUSE_PUBLICATION_TOOLTIP } from './managedWarehouse.resources'
import { disableWarehouseProject, useWarehouseProjectState } from './warehouseDemoStore'
import { WarehouseDestinationRowMenu } from './WarehouseDestinationRowMenu'
import {
  formatReplicationLagSeconds,
  getWarehouseDestinationStatusLabel,
} from './warehouseReplication.utils'
import { WarehouseSyncChip } from './WarehouseSyncChip'

export function WarehouseDestinationRow() {
  const { ref: projectRef } = useParams()
  const state = useWarehouseProjectState(projectRef)
  const [showDeleteDestinationForm, setShowDeleteDestinationForm] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  if (!state.enabled || !state.pipelineId) return null

  const destinationName = `DuckLake (Pipeline ID: ${state.pipelineId})`
  const statusLabel = getWarehouseDestinationStatusLabel(
    state.replicationPhase,
    state.pipelineStatus
  )
  const lag = formatReplicationLagSeconds(state.lagSeconds)
  const isCaughtUp = state.lagSeconds === 0 || state.lagSeconds === 2
  const isPipelineStopped =
    state.pipelineStatus === 'stopped' && state.replicationPhase === 'streaming'
  const showLag =
    !isPipelineStopped &&
    (state.replicationPhase === 'streaming' || state.replicationPhase === 'backfilling')

  const onDeleteDestination = async () => {
    if (!projectRef) return
    setIsDeleting(true)
    disableWarehouseProject(projectRef)
    setIsDeleting(false)
    setShowDeleteDestinationForm(false)
  }

  return (
    <>
      <TableRow>
        <TableCell>
          <Database size={18} className="text-foreground-light" />
        </TableCell>
        <TableCell className="max-w-[180px]">
          <div>
            <p>{destinationName}</p>
            <p className="text-foreground-lighter">{state.destinationName}</p>
          </div>
        </TableCell>
        <TableCell>
          <WarehouseSyncChip phase={state.replicationPhase} pipelineStatus={state.pipelineStatus} />
          {statusLabel === 'Failed' && (
            <p className="text-xs text-foreground-lighter mt-1">Managed Warehouse pipeline</p>
          )}
        </TableCell>
        <TableCell>
          {showLag ? (
            isCaughtUp ? (
              <p className="text-foreground-light">Caught up</p>
            ) : (
              <p className="text-foreground-light">{lag}</p>
            )
          ) : (
            <Minus size={18} className="text-foreground-lighter" />
          )}
        </TableCell>
        <TableCell>
          <Tooltip>
            <TooltipTrigger asChild>
              <span className="text-foreground-light">{state.publicationName}</span>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="max-w-xs">
              {MANAGED_WAREHOUSE_PUBLICATION_TOOLTIP}
            </TooltipContent>
          </Tooltip>
        </TableCell>
        <TableCell>
          <div className="flex items-center justify-end gap-x-2">
            <Button asChild variant="default" className="relative">
              <Link href={`/project/${projectRef}/database/replication/${state.pipelineId}`}>
                View pipeline
              </Link>
            </Button>
            <WarehouseDestinationRowMenu
              replicationPhase={state.replicationPhase}
              pipelineStatus={state.pipelineStatus}
              onDeleteClick={() => setShowDeleteDestinationForm(true)}
            />
          </div>
        </TableCell>
      </TableRow>

      <DeleteDestination
        visible={showDeleteDestinationForm}
        setVisible={setShowDeleteDestinationForm}
        onDelete={onDeleteDestination}
        isLoading={isDeleting}
        name={destinationName}
      />
    </>
  )
}
