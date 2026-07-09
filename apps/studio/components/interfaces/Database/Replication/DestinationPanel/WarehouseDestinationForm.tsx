import { useParams } from 'common'
import { useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'
import { Button, Checkbox, Label, SheetFooter, SheetSection } from 'ui'
import { FormItemLayout } from 'ui-patterns/form/FormItemLayout/FormItemLayout'

import {
  enableWarehouseProject,
  getDefaultIncludedSchemas,
} from '@/components/interfaces/Database/Warehouse/warehouseDemoStore'
import { useSchemasQuery } from '@/data/database/schemas-query'
import { EMPTY_ARR } from '@/lib/void'

interface WarehouseDestinationFormProps {
  onClose: () => void
}

export function WarehouseDestinationForm({ onClose }: WarehouseDestinationFormProps) {
  const { ref: projectRef } = useParams()
  const { data: schemas } = useSchemasQuery({ projectRef })

  const replicableSchemas = useMemo(
    () => getDefaultIncludedSchemas((schemas ?? EMPTY_ARR).map((schema) => schema.name)).sort(),
    [schemas]
  )

  const [selectedSchemas, setSelectedSchemas] = useState<string[]>([])
  const [isEnabling, setIsEnabling] = useState(false)

  useEffect(() => {
    if (replicableSchemas.length === 0) return
    setSelectedSchemas((current) => (current.length === 0 ? replicableSchemas : current))
  }, [replicableSchemas])

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
      <SheetSection className="grow overflow-auto px-0 py-0">
        <div className="flex flex-col gap-y-6 p-5">
          <div className="flex flex-col gap-y-4">
            <FormItemLayout isReactForm={false} layout="horizontal" label="Replicated schemas">
              <div className="flex w-full flex-col gap-y-3">
                <div className="flex max-h-64 flex-col gap-y-2 overflow-y-auto">
                  {replicableSchemas.map((schema) => (
                    <div key={schema} className="flex items-center gap-x-2">
                      <Checkbox
                        id={`destination-warehouse-schema-${schema}`}
                        checked={selectedSet.has(schema)}
                        onCheckedChange={(checked) => onToggleSchema(schema, checked === true)}
                      />
                      <Label
                        htmlFor={`destination-warehouse-schema-${schema}`}
                        className="text-sm font-normal"
                      >
                        {schema}
                      </Label>
                    </div>
                  ))}
                  {replicableSchemas.length === 0 && (
                    <p className="text-sm text-foreground-light">No replicable schemas found.</p>
                  )}
                </div>
                {replicableSchemas.length > 0 && (
                  <Button
                    type="button"
                    variant="default"
                    size="tiny"
                    className="w-fit"
                    onClick={() => setSelectedSchemas(replicableSchemas)}
                  >
                    Select all
                  </Button>
                )}
              </div>
            </FormItemLayout>
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
