import { useParams } from 'common'
import { Warehouse } from 'lucide-react'
import { parseAsBoolean, useQueryState } from 'nuqs'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import {
  Badge,
  Button,
  DialogSectionSeparator,
  Sheet,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetSection,
  SheetTitle,
} from 'ui'
import { FormItemLayout } from 'ui-patterns/form/FormItemLayout/FormItemLayout'

import { updateWarehouseIncludedSchemas, useWarehouseProjectState } from './warehouseDemoStore'
import { WarehouseExternalAccess } from './WarehouseExternalAccess'
import { WarehouseSchemaScope } from './WarehouseSchemaScope'

function schemasEqual(a: readonly string[], b: readonly string[]) {
  if (a.length !== b.length) return false
  const sortedA = [...a].sort()
  const sortedB = [...b].sort()
  return sortedA.every((schema, index) => schema === sortedB[index])
}

export function WarehouseManageSheet() {
  const { ref: projectRef } = useParams()
  const warehouseState = useWarehouseProjectState(projectRef)

  const [showManage, setShowManage] = useQueryState(
    'warehouseManage',
    parseAsBoolean.withDefault(false)
  )
  const [draftSchemas, setDraftSchemas] = useState<string[]>([])
  const [isSaving, setIsSaving] = useState(false)

  const onClose = () => setShowManage(false)

  useEffect(() => {
    if (!showManage) return
    setDraftSchemas([...warehouseState.includedSchemas])
  }, [showManage, warehouseState.includedSchemas])

  if (!warehouseState.enabled || !projectRef) return null

  const isSchemaSelectionDisabled =
    warehouseState.replicationPhase === 'provisioning' ||
    warehouseState.replicationPhase === 'backfilling'

  const isDirty = !schemasEqual(draftSchemas, warehouseState.includedSchemas)

  const onSave = async () => {
    if (!projectRef || !isDirty) return
    setIsSaving(true)
    updateWarehouseIncludedSchemas(projectRef, draftSchemas)
    setIsSaving(false)
    toast.success('Warehouse destination updated')
    onClose()
  }

  return (
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
          </SheetHeader>

          <FormItemLayout
            isReactForm={false}
            layout="horizontal"
            className="p-5 [&>div]:gap-y-1 [&>div>span]:text-foreground-lighter"
            label="Type"
          >
            <div className="flex h-auto items-center gap-x-3 py-2 text-left">
              <Warehouse size={20} strokeWidth={1.5} className="shrink-0 text-foreground-light" />
              <div className="flex items-center gap-x-2">
                <span className="text-sm text-foreground">Warehouse</span>
                <Badge variant="warning">Alpha</Badge>
              </div>
            </div>
          </FormItemLayout>

          <DialogSectionSeparator />

          <SheetSection className="grow overflow-auto px-0 py-0">
            <div className="p-5">
              <WarehouseSchemaScope
                variant="form"
                disabled={isSchemaSelectionDisabled}
                includedSchemas={draftSchemas}
                onIncludedSchemasChange={setDraftSchemas}
              />
            </div>

            <DialogSectionSeparator />

            <div className="p-5">
              <WarehouseExternalAccess
                projectRef={projectRef}
                warehouseHost={warehouseState.warehouseHost}
              />
            </div>
          </SheetSection>

          <SheetFooter className="justify-between!">
            <Button variant="default" onClick={onClose}>
              Close
            </Button>
            <Button
              disabled={!isDirty || isSchemaSelectionDisabled}
              loading={isSaving}
              onClick={onSave}
            >
              Save changes
            </Button>
          </SheetFooter>
        </div>
      </SheetContent>
    </Sheet>
  )
}
