import { useParams } from 'common'
import { useState } from 'react'
import { toast } from 'sonner'
import { Button, Checkbox, Label, SheetFooter, SheetSection } from 'ui'
import { FormItemLayout } from 'ui-patterns/form/FormItemLayout/FormItemLayout'

import { enableWarehouseProject } from '@/components/interfaces/Database/Warehouse/warehouseDemoStore'
import { useDefaultWarehouseSchemas } from '@/components/interfaces/Database/Warehouse/WarehouseSchemaScope'

interface WarehouseDestinationFormProps {
  onClose: () => void
}

export function WarehouseDestinationForm({ onClose }: WarehouseDestinationFormProps) {
  const { ref: projectRef } = useParams()
  const defaultSchemas = useDefaultWarehouseSchemas()

  const [selectedSchemas, setSelectedSchemas] = useState<string[]>(() => defaultSchemas)
  const [isEnabling, setIsEnabling] = useState(false)

  const selectedSet = new Set(selectedSchemas)

  const onToggleSchema = (schema: string, checked: boolean) => {
    setSelectedSchemas((prev) => (checked ? [...prev, schema] : prev.filter((s) => s !== schema)))
  }

  const onEnable = async () => {
    if (!projectRef || selectedSchemas.length === 0) return
    setIsEnabling(true)
    enableWarehouseProject(projectRef, selectedSchemas)
    setIsEnabling(false)
    toast.success('Warehouse replication started')
    onClose()
  }

  return (
    <>
      <SheetSection className="grow overflow-auto">
        <div className="flex flex-col gap-y-4 p-5">
          <p className="text-sm text-foreground-light">
            Replicate your Postgres data to a separate Warehouse endpoint. Tables keep the same
            schema and table names (for example, <code>public.events</code>).
          </p>
          <div>
            <p className="text-sm text-foreground mb-2">Replicated schemas</p>
            <p className="text-sm text-foreground-light mb-3">
              Choose which schemas to replicate. You can change this later.
            </p>
            <div className="flex flex-col gap-y-2 max-h-64 overflow-y-auto">
              {defaultSchemas.map((schema) => (
                <FormItemLayout
                  key={schema}
                  isReactForm={false}
                  layout="flex"
                  label={schema}
                  className="items-center"
                >
                  <Checkbox
                    id={`destination-warehouse-schema-${schema}`}
                    checked={selectedSet.has(schema)}
                    onCheckedChange={(checked) => onToggleSchema(schema, checked === true)}
                  />
                  <Label htmlFor={`destination-warehouse-schema-${schema}`} className="sr-only">
                    Include schema {schema}
                  </Label>
                </FormItemLayout>
              ))}
            </div>
            <Button
              variant="default"
              onClick={() => setSelectedSchemas(defaultSchemas)}
              className="mt-3"
            >
              Select all
            </Button>
          </div>
        </div>
      </SheetSection>
      <SheetFooter>
        <Button variant="default" onClick={onClose}>
          Cancel
        </Button>
        <Button loading={isEnabling} disabled={selectedSchemas.length === 0} onClick={onEnable}>
          Enable Warehouse
        </Button>
      </SheetFooter>
    </>
  )
}
