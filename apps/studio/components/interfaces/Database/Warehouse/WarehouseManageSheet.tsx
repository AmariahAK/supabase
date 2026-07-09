import { useParams } from 'common'
import { parseAsBoolean, useQueryState } from 'nuqs'
import { useState } from 'react'
import {
  Button,
  DialogSectionSeparator,
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetSection,
  SheetTitle,
} from 'ui'

import { useWarehouseProjectState } from './warehouseDemoStore'
import { WarehouseDisableModal } from './WarehouseDisableModal'
import { WarehouseSchemaScope } from './WarehouseSchemaScope'

export function WarehouseManageSheet() {
  const { ref: projectRef } = useParams()
  const warehouseState = useWarehouseProjectState(projectRef)

  const [showManage, setShowManage] = useQueryState(
    'warehouseManage',
    parseAsBoolean.withDefault(false)
  )
  const [, setShowConnect] = useQueryState('showConnect', parseAsBoolean.withDefault(false))
  const [, setConnectTab] = useQueryState('connectTab')
  const [showDisableModal, setShowDisableModal] = useState(false)

  const onClose = () => setShowManage(false)

  const onDisableSuccess = () => {
    onClose()
  }

  if (!warehouseState.enabled) return null

  return (
    <>
      <Sheet
        open={showManage}
        onOpenChange={(open) => {
          if (!open) onClose()
        }}
      >
        <SheetContent size="lg" showClose={false}>
          <div className="flex flex-col h-full" tabIndex={-1}>
            <SheetHeader>
              <SheetTitle>Edit destination</SheetTitle>
              <SheetDescription>Update which schemas are replicated to Warehouse.</SheetDescription>
            </SheetHeader>

            <DialogSectionSeparator />

            <SheetSection className="grow overflow-auto">
              <div className="flex flex-col gap-y-4 p-5">
                <WarehouseSchemaScope
                  disabled={
                    warehouseState.replicationPhase === 'provisioning' ||
                    warehouseState.replicationPhase === 'backfilling'
                  }
                />
              </div>
            </SheetSection>

            <SheetFooter>
              <Button variant="default" onClick={onClose}>
                Close
              </Button>
              <Button
                variant="default"
                onClick={() => {
                  setConnectTab('warehouse')
                  setShowConnect(true)
                }}
              >
                Connect
              </Button>
              <Button variant="danger" onClick={() => setShowDisableModal(true)}>
                Disable Warehouse
              </Button>
            </SheetFooter>
          </div>
        </SheetContent>
      </Sheet>

      <WarehouseDisableModal
        open={showDisableModal}
        onOpenChange={setShowDisableModal}
        onDisabled={onDisableSuccess}
      />
    </>
  )
}
