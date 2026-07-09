import { Check } from 'lucide-react'
import { useMemo, useState } from 'react'
import { FormItemLayout } from 'ui-patterns/form/FormItemLayout/FormItemLayout'

import { WarehouseRotateCredentialsDialog } from './WarehouseRotateCredentialsDialog'
import { EnvRow } from '@/components/interfaces/ConnectSheet/content/server/common/EnvRow'
import {
  buildWarehouseConnectCredentials,
  WAREHOUSE_CONNECT_ENV_VARS,
} from '@/components/interfaces/ConnectSheet/warehouseConnect.constants'
import CopyButton from '@/components/ui/CopyButton'

interface WarehouseExternalAccessProps {
  projectRef: string
  warehouseHost?: string
}

function buildConnectionStringWithPassword(connectionString: string, password: string) {
  return connectionString.replace('[YOUR-PASSWORD]', encodeURIComponent(password))
}

export function WarehouseExternalAccess({
  projectRef,
  warehouseHost,
}: WarehouseExternalAccessProps) {
  const [rotatedPassword, setRotatedPassword] = useState<string | null>(null)

  const credentials = useMemo(
    () => buildWarehouseConnectCredentials({ projectRef, warehouseHost }),
    [projectRef, warehouseHost]
  )

  const passwordValue = rotatedPassword ?? credentials.passwordPlaceholder
  const connectionString = rotatedPassword
    ? buildConnectionStringWithPassword(credentials.connectionString, rotatedPassword)
    : credentials.connectionString

  return (
    <div className="flex flex-col gap-y-6">
      <p className="text-sm font-medium text-foreground">External access</p>

      <FormItemLayout isReactForm={false} layout="horizontal" label="Endpoint">
        <div className="w-full overflow-hidden rounded-lg border bg-surface-100">
          <CredentialEnvRow
            name={WAREHOUSE_CONNECT_ENV_VARS.host}
            value={credentials.host}
            copyLabel="Copy endpoint"
          />
        </div>
      </FormItemLayout>

      <FormItemLayout isReactForm={false} layout="horizontal" label="Connection string">
        <div className="w-full overflow-hidden rounded-lg border bg-surface-100">
          <CredentialEnvRow
            name={WAREHOUSE_CONNECT_ENV_VARS.databaseUrl}
            value={connectionString}
            copyLabel="Copy connection string"
          />
        </div>
      </FormItemLayout>

      <FormItemLayout isReactForm={false} layout="horizontal" label="Credentials">
        <div className="flex w-full flex-col gap-y-3">
          <div className="overflow-hidden rounded-lg border bg-surface-100">
            <div className="divide-y">
              <CredentialEnvRow
                name={WAREHOUSE_CONNECT_ENV_VARS.user}
                value={credentials.user}
                copyLabel="Copy user"
              />
              <CredentialEnvRow
                name={WAREHOUSE_CONNECT_ENV_VARS.password}
                value={passwordValue}
                copyLabel="Copy password"
              />
            </div>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            {rotatedPassword ? (
              <span className="flex items-center gap-2 text-sm text-foreground-light">
                <Check size={16} className="shrink-0 text-brand" />
                New password shown until refresh.
              </span>
            ) : (
              <span className="text-sm text-foreground-light">Forgot your Warehouse password?</span>
            )}
            <WarehouseRotateCredentialsDialog onRotated={setRotatedPassword} />
          </div>
        </div>
      </FormItemLayout>
    </div>
  )
}

function CredentialEnvRow({
  name,
  value,
  copyLabel,
}: {
  name: string
  value: string
  copyLabel: string
}) {
  return (
    <EnvRow name={name} value={value}>
      <CopyButton variant="default" size="tiny" iconOnly aria-label={copyLabel} text={value} />
    </EnvRow>
  )
}
