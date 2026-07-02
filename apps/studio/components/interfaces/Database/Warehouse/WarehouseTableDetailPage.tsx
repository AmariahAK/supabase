import { useParams } from 'common'

import { buildTableDetailSqlEditorUrl } from '@/components/interfaces/Database/Tables/tableDetailActions.utils'
import { TableDetailPreviewHeader } from '@/components/interfaces/Database/Tables/TableDetailPreviewHeader'
import { TableDetailTablePreview } from '@/components/interfaces/Database/Tables/TableDetailTablePreview'
import {
  getSourceTableKey,
  getWarehouseQualifiedTableName,
} from '@/components/interfaces/Database/Warehouse/warehouseNaming.utils'
import { WarehouseTableDetailMetrics } from '@/components/interfaces/Database/Warehouse/WarehouseTableDetailMetrics'
import type { TableLike } from '@/data/table-editor/table-editor-types'

interface WarehouseTableDetailPageProps {
  table: TableLike
}

export function WarehouseTableDetailPage({ table }: WarehouseTableDetailPageProps) {
  const { ref: projectRef } = useParams()
  const tableKey = getSourceTableKey(table.schema, table.name)
  const qualifiedName = getWarehouseQualifiedTableName(tableKey)
  const sqlEditorUrl =
    projectRef !== undefined
      ? buildTableDetailSqlEditorUrl(projectRef, table.schema, table.name, {
          isWarehouseView: true,
        })
      : undefined

  return (
    <div className="flex flex-col gap-8">
      <WarehouseTableDetailMetrics table={table} />

      <div className="space-y-4">
        <TableDetailPreviewHeader sqlEditorUrl={sqlEditorUrl} />
        <TableDetailTablePreview table={table} qualifiedName={qualifiedName} />
      </div>
    </div>
  )
}
