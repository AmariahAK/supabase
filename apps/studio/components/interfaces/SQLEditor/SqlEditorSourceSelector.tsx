import { LOCAL_STORAGE_KEYS, useParams } from 'common'

import { isWarehouseProjectEnabled } from '@/components/interfaces/Database/Warehouse/warehouseDemoStore'
import { DatabaseSelector } from '@/components/ui/DatabaseSelector'
import { useIsWarehouseEnabled } from '@/hooks/misc/useIsWarehouseEnabled'
import { useLocalStorageQuery } from '@/hooks/misc/useLocalStorage'
import { useDatabaseSelectorStateSnapshot } from '@/state/database-selector'

export const SQL_EDITOR_WAREHOUSE_SOURCE_ID = 'warehouse'

export type SqlEditorSourceType = 'postgres' | 'warehouse'

type SqlEditorSourceSelectorProps = {
  className?: string
  align?: 'start' | 'end'
  fullWidth?: boolean
  onSelectSource: (sourceId: string) => void
  selectedSourceId: string
}

export function useSqlEditorSource() {
  const { ref: projectRef } = useParams()
  const isWarehouseFeatureEnabled = useIsWarehouseEnabled()
  const warehouseProjectEnabled = isWarehouseProjectEnabled(projectRef)
  const databaseSelectorState = useDatabaseSelectorStateSnapshot()

  const [storedSourceId] = useLocalStorageQuery(
    LOCAL_STORAGE_KEYS.SQL_EDITOR_LAST_SELECTED_DB(projectRef as string),
    ''
  )

  const sourceId = storedSourceId || databaseSelectorState.selectedDatabaseId || projectRef || ''
  const isWarehouse = sourceId === SQL_EDITOR_WAREHOUSE_SOURCE_ID

  return {
    sourceId,
    type: isWarehouse ? ('warehouse' as const) : ('postgres' as const),
    isWarehouse,
    showWarehouseOption: isWarehouseFeatureEnabled && warehouseProjectEnabled,
  }
}

export function SqlEditorSourceSelector({
  className,
  align = 'end',
  fullWidth = false,
  onSelectSource,
  selectedSourceId,
}: SqlEditorSourceSelectorProps) {
  const { showWarehouseOption } = useSqlEditorSource()
  const controlClassName = fullWidth ? 'w-full [&>span]:w-full' : className

  const trailingAdditionalOptions = showWarehouseOption
    ? [
        {
          id: SQL_EDITOR_WAREHOUSE_SOURCE_ID,
          name: 'Warehouse',
          description: 'Warehouse endpoint with 1:1 schema names',
        },
      ]
    : []

  return (
    <DatabaseSelector
      label="Source"
      selectedDatabaseId={selectedSourceId.length === 0 ? undefined : selectedSourceId}
      onSelectId={onSelectSource}
      className={controlClassName}
      align={align}
      trailingAdditionalOptions={trailingAdditionalOptions}
    />
  )
}

export function getSqlEditorSourceSummary({
  projectRef,
  sourceId,
  isWarehouse,
}: {
  projectRef?: string
  sourceId: string
  isWarehouse: boolean
}) {
  if (isWarehouse) return 'Warehouse'

  const isPrimary = sourceId.length === 0 || sourceId === projectRef
  return isPrimary ? undefined : 'Replica'
}
