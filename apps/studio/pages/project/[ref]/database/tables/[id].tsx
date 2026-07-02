import { useParams } from 'common'
import { useRouter } from 'next/router'
import { useEffect } from 'react'
import { ShimmeringLoader } from 'ui-patterns/ShimmeringLoader'

import { TableDetailOverviewTab } from '@/components/interfaces/Database/Tables/TableDetailOverviewTab'
import { WarehouseTableDetailPage } from '@/components/interfaces/Database/Warehouse/WarehouseTableDetailPage'
import { TableDetailLayout } from '@/components/layouts/DatabaseLayout/TableDetailLayout'
import { DefaultLayout } from '@/components/layouts/DefaultLayout'
import { useTableEditorQuery } from '@/data/table-editor/table-editor-query'
import { isTableLike } from '@/data/table-editor/table-editor-types'
import { useSelectedProjectQuery } from '@/hooks/misc/useSelectedProject'
import { useTableDetailWarehouseView } from '@/hooks/misc/useTableDetailWarehouseView'
import type { NextPageWithLayout } from '@/types'

const TableDetailOverviewPage: NextPageWithLayout = () => {
  const router = useRouter()
  const { id: _id, ref } = useParams()
  const id = _id ? Number(_id) : undefined
  const { data: project } = useSelectedProjectQuery()
  const { data: selectedTable, isPending } = useTableEditorQuery({
    projectRef: project?.ref,
    connectionString: project?.connectionString,
    id,
  })
  const { isWarehouseDetailView } = useTableDetailWarehouseView(selectedTable?.schema)

  useEffect(() => {
    if (isPending || selectedTable === undefined || isTableLike(selectedTable)) return
    router.replace(`/project/${ref}/database/tables/${id}/columns`)
  }, [id, isPending, ref, router, selectedTable])

  if (isPending) {
    return <ShimmeringLoader />
  }

  if (selectedTable === undefined) {
    return null
  }

  if (!isTableLike(selectedTable)) {
    return <ShimmeringLoader />
  }

  if (isWarehouseDetailView) {
    return <WarehouseTableDetailPage table={selectedTable} />
  }

  return <TableDetailOverviewTab table={selectedTable} />
}

TableDetailOverviewPage.getLayout = (page) => (
  <DefaultLayout>
    <TableDetailLayout section="overview">{page}</TableDetailLayout>
  </DefaultLayout>
)

export default TableDetailOverviewPage
