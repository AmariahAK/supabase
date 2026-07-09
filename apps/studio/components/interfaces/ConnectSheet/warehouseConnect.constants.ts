import { buildWarehouseConnectionString } from '@/components/interfaces/Database/Warehouse/warehouseReplication.utils'

export type WarehouseConnectEngine = 'env' | 'psql' | 'uri' | 'nodejs'

export const WAREHOUSE_CONNECT_ENGINES: { key: WarehouseConnectEngine; label: string }[] = [
  { key: 'env', label: 'Environment variables' },
  { key: 'uri', label: 'Connection string' },
  { key: 'psql', label: 'psql' },
  { key: 'nodejs', label: 'Node.js' },
]

export const WAREHOUSE_CONNECT_ENV_VARS = {
  host: 'WAREHOUSE_HOST',
  port: 'WAREHOUSE_PORT',
  database: 'WAREHOUSE_DATABASE',
  user: 'WAREHOUSE_USER',
  password: 'WAREHOUSE_PASSWORD',
  databaseUrl: 'DATABASE_URL',
} as const

export type WarehouseConnectCredentialValues = {
  host: string
  port: string
  database: string
  user: string
  passwordPlaceholder: string
  connectionString: string
}

export function buildWarehouseConnectCredentials({
  projectRef,
  warehouseHost,
}: {
  projectRef: string
  warehouseHost?: string
}): WarehouseConnectCredentialValues {
  const host = warehouseHost?.length ? warehouseHost : `warehouse.${projectRef}.supabase.co`
  const port = '5432'
  const database = 'postgres'
  const user = 'postgres'
  const passwordPlaceholder = '[YOUR-PASSWORD]'
  const connectionString = buildWarehouseConnectionString({
    projectRef,
    warehouseHost: host,
    databaseName: database,
    port: Number(port),
  })

  return {
    host,
    port,
    database,
    user,
    passwordPlaceholder,
    connectionString,
  }
}

export function buildWarehouseConnectEnv(credentials: WarehouseConnectCredentialValues): string {
  return [
    `${WAREHOUSE_CONNECT_ENV_VARS.host}=${credentials.host}`,
    `${WAREHOUSE_CONNECT_ENV_VARS.port}=${credentials.port}`,
    `${WAREHOUSE_CONNECT_ENV_VARS.database}=${credentials.database}`,
    `${WAREHOUSE_CONNECT_ENV_VARS.user}=${credentials.user}`,
    `${WAREHOUSE_CONNECT_ENV_VARS.password}=${credentials.passwordPlaceholder}`,
    `${WAREHOUSE_CONNECT_ENV_VARS.databaseUrl}=${credentials.connectionString}`,
  ].join('\n')
}

export function getWarehouseConnectEngineContent(
  engine: WarehouseConnectEngine,
  credentials: WarehouseConnectCredentialValues
): { headerLabel: string; language: 'bash' | 'ts'; value: string } {
  switch (engine) {
    case 'psql':
      return {
        headerLabel: 'terminal',
        language: 'bash',
        value: `psql "${credentials.connectionString}"`,
      }
    case 'nodejs':
      return {
        headerLabel: 'warehouse.ts',
        language: 'ts',
        value: `import pg from 'pg'

const client = new pg.Client({
  connectionString: process.env.DATABASE_URL,
})

await client.connect()
const result = await client.query('select now()')
console.log(result.rows)`,
      }
    case 'uri':
      return {
        headerLabel: 'connection.txt',
        language: 'bash',
        value: credentials.connectionString,
      }
    case 'env':
      return {
        headerLabel: 'warehouse.env',
        language: 'bash',
        value: buildWarehouseConnectEnv(credentials),
      }
  }
}
