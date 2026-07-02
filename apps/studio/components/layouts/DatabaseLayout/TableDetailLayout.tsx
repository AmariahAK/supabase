import { PermissionAction } from '@supabase/shared-types/out/constants'
import { useParams } from 'common'
import { Edit } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/router'
import React, { type PropsWithChildren } from 'react'
import {
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbSeparator,
  Button,
  NavMenu,
  NavMenuItem,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from 'ui'
import { PageContainer } from 'ui-patterns/PageContainer'
import {
  PageHeader,
  PageHeaderAside,
  PageHeaderBreadcrumb,
  PageHeaderDescription,
  PageHeaderMeta,
  PageHeaderNavigationTabs,
  PageHeaderSummary,
  PageHeaderTitle,
} from 'ui-patterns/PageHeader'
import { ShimmeringLoader } from 'ui-patterns/ShimmeringLoader'
import { useSnapshot } from 'valtio'

import DatabaseLayout from './DatabaseLayout'
import { buildTableEditorUrl } from '@/components/grid/SupabaseGrid.utils'
import { buildTableDetailSqlEditorUrl } from '@/components/interfaces/Database/Tables/tableDetailActions.utils'
import { TableDetailSplitLinkButton } from '@/components/interfaces/Database/Tables/TableDetailSplitLinkButton'
import {
  formatWarehouseSize,
  getWarehouseLinkedStorageTooltip,
  getWarehouseStorageDisplay,
  getWarehouseStorageTooltip,
  resolveWarehouseTableState,
  warehouseDemoStore,
} from '@/components/interfaces/Database/Warehouse/warehouseDemoStore'
import { WarehouseLinkedTableStatus } from '@/components/interfaces/Database/Warehouse/WarehouseLinkedTableStatus'
import {
  getSourceSchemaName,
  getSourceTableKey,
  getWarehouseCopyTooltip,
  getWarehouseSchemaName,
} from '@/components/interfaces/Database/Warehouse/warehouseNaming.utils'
import { WarehouseStatusText } from '@/components/interfaces/Database/Warehouse/WarehouseSyncChip'
import {
  buildTableDetailUrl,
  WAREHOUSE_TABLE_DETAIL_VIEW,
  type TableDetailSection,
} from '@/components/interfaces/Database/Warehouse/warehouseTableEditor.utils'
import DeleteConfirmationDialogs from '@/components/interfaces/TableGridEditor/DeleteConfirmationDialogs'
import { SidePanelEditor } from '@/components/interfaces/TableGridEditor/SidePanelEditor/SidePanelEditor'
import { EntityTypeIcon } from '@/components/ui/EntityTypeIcon'
import { useDatabasePublicationsQuery } from '@/data/database-publications/database-publications-query'
import { ENTITY_TYPE } from '@/data/entity-types/entity-type-constants'
import { useTableEditorQuery } from '@/data/table-editor/table-editor-query'
import { isTableLike } from '@/data/table-editor/table-editor-types'
import { useTablesQuery } from '@/data/tables/tables-query'
import { useAsyncCheckPermissions } from '@/hooks/misc/useCheckPermissions'
import { useSelectedProjectQuery } from '@/hooks/misc/useSelectedProject'
import { useTableDetailWarehouseView } from '@/hooks/misc/useTableDetailWarehouseView'
import { useTableEditorStateSnapshot } from '@/state/table-editor'
import { TableEditorTableStateContextProvider } from '@/state/table-editor-table'

export type { TableDetailSection } from '@/components/interfaces/Database/Warehouse/warehouseTableEditor.utils'

function TableHeaderFeatureStatus({
  label,
  enabled,
  tooltip,
}: {
  label: string
  enabled: boolean
  tooltip: string
}) {
  return (
    <span className="inline-flex items-center gap-1.5 text-sm text-foreground-light">
      <span
        aria-hidden
        className={
          enabled
            ? 'size-1.5 shrink-0 rounded-full bg-brand'
            : 'size-1.5 shrink-0 rounded-full bg-foreground-muted'
        }
      />
      <WarehouseStatusText text={label} tooltip={tooltip} />
    </span>
  )
}

interface TableDetailLayoutProps {
  section: TableDetailSection
}

export function TableDetailLayout({
  section: _section,
  children,
}: PropsWithChildren<TableDetailLayoutProps>) {
  const router = useRouter()
  const snap = useTableEditorStateSnapshot()
  const { id: _id, ref } = useParams()
  const id = _id ? Number(_id) : undefined

  const { data: project } = useSelectedProjectQuery()
  const { data: selectedTable, isPending: isLoading } = useTableEditorQuery({
    projectRef: project?.ref,
    connectionString: project?.connectionString,
    id,
  })

  const { isWarehouseDetailView } = useTableDetailWarehouseView(selectedTable?.schema)

  const sourceSchemaForSizes =
    selectedTable !== undefined && isWarehouseDetailView
      ? getSourceSchemaName(selectedTable.schema)
      : undefined

  const { data: sourceSchemaTables } = useTablesQuery(
    {
      projectRef: project?.ref,
      connectionString: project?.connectionString,
      schema: sourceSchemaForSizes,
      includeColumns: false,
    },
    { enabled: Boolean(project?.ref && sourceSchemaForSizes) }
  )

  const linkedPostgresSize =
    selectedTable !== undefined && isWarehouseDetailView
      ? sourceSchemaTables?.find((table) => table.name === selectedTable.name)?.size
      : undefined

  const { data: publications } = useDatabasePublicationsQuery({
    projectRef: project?.ref,
    connectionString: project?.connectionString,
  })
  const realtimePublication = (publications ?? []).find(
    (publication) => publication.name === 'supabase_realtime'
  )
  const realtimeEnabled =
    selectedTable?.id !== undefined &&
    (realtimePublication?.tables ?? []).some((table) => table.id === selectedTable.id)

  const warehouseSnap = useSnapshot(warehouseDemoStore)
  const tableKey =
    selectedTable?.schema !== undefined && selectedTable?.name !== undefined
      ? getSourceTableKey(selectedTable.schema, selectedTable.name)
      : undefined
  const warehouseState = tableKey
    ? resolveWarehouseTableState(tableKey, warehouseSnap.tables[tableKey] ?? { mode: 'postgres' }, {
        isWarehouseView: isWarehouseDetailView,
      })
    : undefined

  const { can: canUpdateTables } = useAsyncCheckPermissions(
    PermissionAction.TENANT_SQL_ADMIN_WRITE,
    'tables'
  )

  const isTable = selectedTable !== undefined && isTableLike(selectedTable)
  const headerEntityType = isWarehouseDetailView
    ? ENTITY_TYPE.WAREHOUSE_TABLE
    : selectedTable?.entity_type
  const displaySchema =
    selectedTable !== undefined && isWarehouseDetailView
      ? getWarehouseSchemaName(getSourceSchemaName(selectedTable.schema))
      : selectedTable?.schema
  const showPoliciesTab = isTable && !isWarehouseDetailView
  const showSettingsTab = isTable && !isWarehouseDetailView
  const hasWarehouseStorage = warehouseState?.mode === 'has_warehouse_copy'
  const warehouseStorageDisplay =
    isTable && hasWarehouseStorage && !isWarehouseDetailView
      ? getWarehouseStorageDisplay(warehouseState, selectedTable.size)
      : null

  const warehouseEditorSchema =
    selectedTable !== undefined && isWarehouseDetailView
      ? getWarehouseSchemaName(getSourceSchemaName(selectedTable.schema))
      : undefined

  const tableEditorUrl =
    selectedTable !== undefined
      ? buildTableEditorUrl({
          projectRef: ref,
          tableId: selectedTable.id,
          schema: warehouseEditorSchema ?? selectedTable.schema,
        })
      : undefined

  const sqlEditorUrl =
    selectedTable !== undefined && ref !== undefined
      ? buildTableDetailSqlEditorUrl(ref, selectedTable.schema, selectedTable.name, {
          isWarehouseView: isWarehouseDetailView,
        })
      : undefined

  const qualifiedTableName =
    selectedTable !== undefined ? `${selectedTable.schema}.${selectedTable.name}` : undefined
  const schemaTooltip = qualifiedTableName
  const warehouseSizeLabel =
    isTable && isWarehouseDetailView
      ? (selectedTable.size ?? formatWarehouseSize(warehouseState?.warehouseSizeBytes))
      : undefined
  const warehouseLensStorageDisplay =
    isTable && isWarehouseDetailView && warehouseState?.mode === 'has_warehouse_copy'
      ? getWarehouseStorageDisplay(warehouseState, linkedPostgresSize, warehouseSizeLabel)
      : null
  const warehouseSizeTooltip = warehouseLensStorageDisplay
    ? getWarehouseLinkedStorageTooltip(warehouseLensStorageDisplay, true)
    : undefined

  const navigationItems =
    id && ref
      ? isWarehouseDetailView
        ? [
            {
              label: 'Overview',
              href: buildTableDetailUrl(ref, id, {
                view: WAREHOUSE_TABLE_DETAIL_VIEW,
                section: 'overview',
              }),
            },
            {
              label: 'Storage',
              href: buildTableDetailUrl(ref, id, {
                view: WAREHOUSE_TABLE_DETAIL_VIEW,
                section: 'storage',
              }),
            },
          ]
        : [
            {
              label: 'Overview',
              href: buildTableDetailUrl(ref, id, { section: 'overview' }),
            },
            {
              label: 'Columns',
              href: buildTableDetailUrl(ref, id, { section: 'columns' }),
            },
            ...(showPoliciesTab
              ? [
                  {
                    label: 'Policies',
                    href: buildTableDetailUrl(ref, id, { section: 'policies' }),
                  },
                ]
              : []),
            ...(showSettingsTab
              ? [
                  {
                    label: 'Settings',
                    href: buildTableDetailUrl(ref, id, { section: 'settings' }),
                  },
                ]
              : []),
          ]
      : []

  return (
    <DatabaseLayout title="Tables">
      <div className="flex min-h-full w-full flex-col items-stretch">
        <PageHeader size="full" className="sticky top-0 z-10 bg-surface-75">
          <PageHeaderBreadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink asChild>
                  <Link href={`/project/${ref}/database/tables`}>Tables</Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              {selectedTable && (
                <>
                  <BreadcrumbSeparator />
                  <BreadcrumbItem>
                    <span>{selectedTable.name}</span>
                  </BreadcrumbItem>
                </>
              )}
            </BreadcrumbList>
          </PageHeaderBreadcrumb>

          <PageHeaderMeta className="mb-4">
            <PageHeaderSummary>
              <div className="flex items-center gap-2">
                {selectedTable && headerEntityType && isWarehouseDetailView ? (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span className="inline-flex shrink-0">
                        <EntityTypeIcon type={headerEntityType} />
                      </span>
                    </TooltipTrigger>
                    <TooltipContent side="bottom">
                      {getWarehouseCopyTooltip(
                        getSourceTableKey(selectedTable.schema, selectedTable.name)
                      )}
                    </TooltipContent>
                  </Tooltip>
                ) : (
                  selectedTable && headerEntityType && <EntityTypeIcon type={headerEntityType} />
                )}
                <PageHeaderTitle>
                  {isLoading ? <ShimmeringLoader className="w-40" /> : (selectedTable?.name ?? '')}
                </PageHeaderTitle>
              </div>

              {selectedTable && !isLoading && (
                <PageHeaderDescription className="flex flex-col gap-1 text-sm!">
                  <div className="flex flex-row flex-wrap items-center gap-x-4 gap-y-1 text-foreground-light">
                    {displaySchema !== undefined && schemaTooltip !== undefined && (
                      <WarehouseStatusText text={displaySchema} tooltip={schemaTooltip} />
                    )}
                    {isTable && selectedTable.live_rows_estimate !== undefined && (
                      <span>{selectedTable.live_rows_estimate.toLocaleString()} rows</span>
                    )}
                    {isTable &&
                      (isWarehouseDetailView && warehouseSizeLabel && warehouseSizeTooltip ? (
                        <WarehouseStatusText
                          text={warehouseSizeLabel}
                          tooltip={warehouseSizeTooltip}
                        />
                      ) : warehouseStorageDisplay?.postgresSize ? (
                        <WarehouseStatusText
                          text={warehouseStorageDisplay.postgresSize}
                          tooltip={getWarehouseStorageTooltip(warehouseStorageDisplay)}
                        />
                      ) : (
                        selectedTable.size
                      ))}
                    {isTable && !isWarehouseDetailView && (
                      <TableHeaderFeatureStatus
                        label="RLS"
                        enabled={selectedTable.rls_enabled}
                        tooltip={
                          selectedTable.rls_enabled
                            ? 'Row Level Security is enabled. Row access is controlled by policies.'
                            : 'Row Level Security is disabled.'
                        }
                      />
                    )}
                    {isTable && !isWarehouseDetailView && realtimeEnabled && (
                      <TableHeaderFeatureStatus
                        label="Realtime"
                        enabled
                        tooltip="Published to supabase_realtime. Clients can subscribe to row changes."
                      />
                    )}
                    {tableKey && hasWarehouseStorage && (
                      <WarehouseLinkedTableStatus
                        tableKey={tableKey}
                        isWarehouseView={isWarehouseDetailView}
                      />
                    )}
                  </div>
                </PageHeaderDescription>
              )}
            </PageHeaderSummary>

            {isTable && tableEditorUrl && sqlEditorUrl && (
              <PageHeaderAside>
                <div className="flex items-center gap-2">
                  {!isWarehouseDetailView && canUpdateTables && (
                    <Button variant="default" icon={<Edit />} onClick={() => snap.onEditTable()}>
                      Edit definitions
                    </Button>
                  )}
                  <TableDetailSplitLinkButton
                    primaryHref={tableEditorUrl}
                    primaryLabel="View in Table Editor"
                    menuItemHref={sqlEditorUrl}
                    menuItemLabel="Query in SQL Editor"
                    menuAriaLabel="More table actions"
                  />
                </div>
              </PageHeaderAside>
            )}
          </PageHeaderMeta>

          {navigationItems.length > 1 && (
            <PageHeaderNavigationTabs>
              <NavMenu>
                {navigationItems.map((item) => {
                  const isActive = router.asPath.split('?')[0] === item.href.split('?')[0]
                  return (
                    <NavMenuItem key={item.label} active={isActive}>
                      <Link href={item.href}>{item.label}</Link>
                    </NavMenuItem>
                  )
                })}
              </NavMenu>
            </PageHeaderNavigationTabs>
          )}
        </PageHeader>

        <PageContainer
          size={
            _section === 'settings' && !isWarehouseDetailView
              ? 'small'
              : _section === 'storage' && isWarehouseDetailView
                ? 'small'
                : 'large'
          }
          className="py-8"
        >
          {children}
        </PageContainer>
      </div>

      {project?.ref !== undefined &&
        selectedTable !== undefined &&
        isTable &&
        !isWarehouseDetailView && (
          <TableEditorTableStateContextProvider
            key={`table-editor-table-${selectedTable.id}`}
            projectRef={project.ref}
            table={selectedTable}
          >
            <DeleteConfirmationDialogs
              selectedTable={selectedTable}
              onTableDeleted={() => {
                router.push(`/project/${ref}/database/tables`)
              }}
            />
            <SidePanelEditor includeColumns selectedTable={selectedTable} />
          </TableEditorTableStateContextProvider>
        )}
    </DatabaseLayout>
  )
}
