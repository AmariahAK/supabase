export type DestinationType =
  | 'Read Replica'
  | 'Warehouse'
  | 'BigQuery'
  | 'Analytics Bucket'
  | 'DuckLake'
  | 'Snowflake'

export type ExistingDestination = {
  sourceId?: number
  destinationId: number
  pipelineId?: number
  enabled: boolean
  statusName?: string
}
