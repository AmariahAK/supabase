import { WarehouseExternalAccess } from '@/components/interfaces/Database/Warehouse/WarehouseExternalAccess'

interface WarehouseConnectCredentialsProps {
  projectRef: string
  warehouseHost?: string
  /** @deprecated Replicated schemas are shown in destination configuration, not connection details. */
  replicatedSchemas?: readonly string[]
}

export function WarehouseConnectCredentials({
  projectRef,
  warehouseHost,
}: WarehouseConnectCredentialsProps) {
  return <WarehouseExternalAccess projectRef={projectRef} warehouseHost={warehouseHost} />
}
