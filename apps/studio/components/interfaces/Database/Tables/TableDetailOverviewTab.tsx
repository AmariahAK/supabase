import { useParams } from 'common'

import { buildTableDetailSqlEditorUrl } from '@/components/interfaces/Database/Tables/tableDetailActions.utils'
import { TableDetailOverviewMetrics } from '@/components/interfaces/Database/Tables/TableDetailOverviewMetrics'
import { TableDetailPreviewHeader } from '@/components/interfaces/Database/Tables/TableDetailPreviewHeader'
import { TableDetailTablePreview } from '@/components/interfaces/Database/Tables/TableDetailTablePreview'
import type { TableLike } from '@/data/table-editor/table-editor-types'

interface TableDetailOverviewTabProps {
  table: TableLike
}

export function TableDetailOverviewTab({ table }: TableDetailOverviewTabProps) {
  const { ref: projectRef } = useParams()
  const sqlEditorUrl =
    projectRef !== undefined
      ? buildTableDetailSqlEditorUrl(projectRef, table.schema, table.name, {
          isWarehouseView: false,
        })
      : undefined

  return (
    <div className="space-y-8">
      <TableDetailOverviewMetrics table={table} />

      <div className="space-y-4">
        <TableDetailPreviewHeader sqlEditorUrl={sqlEditorUrl} />
        <TableDetailTablePreview table={table} />
      </div>
    </div>
  )
}
