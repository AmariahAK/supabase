import {
  buildSqlEditorWarehouseUrl,
  getSourceSchemaName,
  getSourceTableKey,
} from '@/components/interfaces/Database/Warehouse/warehouseNaming.utils'

export function buildSqlEditorPostgresTableUrl(
  projectRef: string,
  schema: string,
  table: string
): string {
  const sql = `SELECT *\nFROM ${schema}.${table}\nLIMIT 100;`

  return `/project/${projectRef}/sql/new?content=${encodeURIComponent(sql)}`
}

export function buildTableDetailSqlEditorUrl(
  projectRef: string,
  schema: string,
  table: string,
  { isWarehouseView }: { isWarehouseView: boolean }
): string {
  if (isWarehouseView) {
    return buildSqlEditorWarehouseUrl(projectRef, getSourceTableKey(schema, table))
  }

  return buildSqlEditorPostgresTableUrl(projectRef, getSourceSchemaName(schema), table)
}
