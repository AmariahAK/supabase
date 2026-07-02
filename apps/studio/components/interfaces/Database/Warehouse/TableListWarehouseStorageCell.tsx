import {
  formatWarehouseSize,
  getWarehouseLinkedStorageTooltip,
  getWarehouseStorageDisplay,
  resolveWarehouseTableState,
  useWarehouseTableState,
} from './warehouseDemoStore'
import { WarehouseStatusText } from './WarehouseSyncChip'

interface TableListWarehouseStorageCellProps {
  tableKey: string
  tableSize?: string
  /** Postgres heap size when viewing the warehouse schema lens. */
  linkedPostgresSize?: string
  isWarehouseSchemaView: boolean
}

export function TableListWarehouseStorageCell({
  tableKey,
  tableSize,
  linkedPostgresSize,
  isWarehouseSchemaView,
}: TableListWarehouseStorageCellProps) {
  const storedState = useWarehouseTableState(tableKey)
  const state = resolveWarehouseTableState(tableKey, storedState, {
    isWarehouseView: isWarehouseSchemaView,
  })

  if (state.mode !== 'has_warehouse_copy') {
    return (
      <p className="text-sm text-foreground-light">
        {tableSize ?? <span className="text-foreground-muted">—</span>}
      </p>
    )
  }

  const storageDisplay = getWarehouseStorageDisplay(
    state,
    isWarehouseSchemaView ? linkedPostgresSize : tableSize,
    isWarehouseSchemaView ? tableSize : undefined
  )
  const sizeLabel = isWarehouseSchemaView
    ? (tableSize ?? formatWarehouseSize(state.warehouseSizeBytes))
    : storageDisplay?.postgresSize
  const sizeTooltip = storageDisplay
    ? getWarehouseLinkedStorageTooltip(storageDisplay, isWarehouseSchemaView)
    : undefined

  if (!sizeLabel) {
    return <span className="text-sm text-foreground-muted">—</span>
  }

  if (!sizeTooltip) {
    return <p className="text-sm text-foreground-light">{sizeLabel}</p>
  }

  return (
    <div
      onClick={(event) => event.stopPropagation()}
      onKeyDown={(event) => event.stopPropagation()}
    >
      <WarehouseStatusText text={sizeLabel} tooltip={sizeTooltip} />
    </div>
  )
}
