import { Badge } from 'ui'

import type { ReplicationPhase, WarehousePipelineStatus } from './warehouseDemoStore'
import { getWarehouseDestinationStatusLabel } from './warehouseReplication.utils'

interface WarehouseSyncChipProps {
  phase: ReplicationPhase
  pipelineStatus?: WarehousePipelineStatus
}

export function WarehouseSyncChip({ phase, pipelineStatus = 'running' }: WarehouseSyncChipProps) {
  const label = getWarehouseDestinationStatusLabel(phase, pipelineStatus)

  const variant =
    pipelineStatus === 'stopped' && phase === 'streaming'
      ? 'default'
      : phase === 'failed'
        ? 'destructive'
        : phase === 'backfilling' || phase === 'provisioning'
          ? 'warning'
          : phase === 'streaming'
            ? 'success'
            : 'default'

  return <Badge variant={variant}>{label}</Badge>
}
