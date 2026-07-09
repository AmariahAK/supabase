import { useParams } from 'common'
import { ChevronLeft } from 'lucide-react'
import Link from 'next/link'
import { useMemo } from 'react'
import { Badge, Button, Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from 'ui'
import { GenericSkeletonLoader } from 'ui-patterns/ShimmeringLoader'

import { isTableReplicated, useWarehouseProjectState } from './warehouseDemoStore'
import { WarehouseObservabilityPanel } from './WarehouseObservabilityPanel'
import { formatReplicationLagSeconds } from './warehouseReplication.utils'
import { WarehouseSyncChip } from './WarehouseSyncChip'
import { useTablesQuery } from '@/data/tables/tables-query'

export function WarehouseReplicationPipelineStatus() {
  const { ref: projectRef } = useParams()
  const state = useWarehouseProjectState(projectRef)

  const { data: tables, isPending: isTablesLoading } = useTablesQuery(
    { projectRef },
    { enabled: !!projectRef && state.enabled }
  )

  const replicatedTables = useMemo(() => {
    if (!tables) return []
    return tables
      .filter((table) => isTableReplicated(projectRef, table.schema, table.name))
      .sort((a, b) => `${a.schema}.${a.name}`.localeCompare(`${b.schema}.${b.name}`))
  }, [tables, projectRef])

  if (!state.enabled || !state.pipelineId) return null

  const destinationName = `DuckLake (Pipeline ID: ${state.pipelineId})`
  const isPipelineStopped =
    state.pipelineStatus === 'stopped' && state.replicationPhase === 'streaming'
  const tableStatusLabel =
    state.replicationPhase === 'failed'
      ? 'Error'
      : state.replicationPhase === 'backfilling'
        ? 'Backfilling'
        : isPipelineStopped
          ? 'Paused'
          : state.replicationPhase === 'streaming'
            ? 'Replicating'
            : 'Pending'

  return (
    <div className="flex flex-col gap-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-x-3">
          <Button asChild variant="outline" icon={<ChevronLeft />} style={{ padding: '5px' }}>
            <Link href={`/project/${projectRef}/database/replication`} />
          </Button>
          <div className="flex items-center gap-x-3">
            <h3 className="text-xl font-semibold">{destinationName}</h3>
            <WarehouseSyncChip
              phase={state.replicationPhase}
              pipelineStatus={state.pipelineStatus}
            />
          </div>
        </div>
      </div>

      <WarehouseObservabilityPanel />

      <div className="border border-default rounded-lg">
        <div className="px-4 py-3 border-b border-default">
          <h4 className="text-sm font-semibold text-foreground">Table replication</h4>
          <p className="text-xs text-foreground-light">
            Tables in replicated schemas use the same schema and table names on the Warehouse
            endpoint.
          </p>
        </div>

        {isTablesLoading ? (
          <div className="p-4">
            <GenericSkeletonLoader />
          </div>
        ) : replicatedTables.length === 0 ? (
          <p className="px-4 py-6 text-sm text-foreground-light">No replicated tables found.</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Table</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Replication lag</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {replicatedTables.map((table) => (
                <TableRow key={`${table.schema}.${table.name}`}>
                  <TableCell>
                    {table.schema}.{table.name}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        tableStatusLabel === 'Error'
                          ? 'destructive'
                          : tableStatusLabel === 'Backfilling' || tableStatusLabel === 'Pending'
                            ? 'warning'
                            : tableStatusLabel === 'Replicating'
                              ? 'success'
                              : 'default'
                      }
                    >
                      {tableStatusLabel}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {isPipelineStopped || state.replicationPhase === 'provisioning'
                      ? '—'
                      : formatReplicationLagSeconds(state.lagSeconds)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  )
}

export function isWarehouseMockPipelineId(
  projectRef: string | undefined,
  pipelineId: string | undefined,
  warehouseState: ReturnType<typeof useWarehouseProjectState>
): boolean {
  if (!projectRef || !pipelineId || !warehouseState.enabled) return false
  return warehouseState.pipelineId === pipelineId
}
