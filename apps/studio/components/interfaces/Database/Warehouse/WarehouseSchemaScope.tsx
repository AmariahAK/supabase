import { useParams } from 'common'
import { useMemo } from 'react'
import { Checkbox, Label } from 'ui'
import { FormItemLayout } from 'ui-patterns/form/FormItemLayout/FormItemLayout'

import { isReplicableSchema } from './warehouseDemoStore'
import { useSchemasQuery } from '@/data/database/schemas-query'
import { EMPTY_ARR } from '@/lib/void'

interface WarehouseSchemaScopeProps {
  disabled?: boolean
  variant?: 'stacked' | 'form'
  includedSchemas: string[]
  onIncludedSchemasChange: (schemas: string[]) => void
}

export function WarehouseSchemaScope({
  disabled = false,
  variant = 'stacked',
  includedSchemas,
  onIncludedSchemasChange,
}: WarehouseSchemaScopeProps) {
  const { ref: projectRef } = useParams()
  const { data: schemas } = useSchemasQuery({ projectRef })

  const replicableSchemas = useMemo(
    () =>
      (schemas ?? EMPTY_ARR)
        .map((s) => s.name)
        .filter(isReplicableSchema)
        .sort(),
    [schemas]
  )

  const includedSet = new Set(includedSchemas)

  const onToggle = (schema: string, checked: boolean) => {
    const next = checked
      ? [...includedSchemas, schema]
      : includedSchemas.filter((s) => s !== schema)
    onIncludedSchemasChange(next)
  }

  const schemaList = (
    <div className="flex w-full flex-col gap-y-3">
      <div className="flex max-h-64 flex-col gap-y-2 overflow-y-auto">
        {replicableSchemas.map((schema) => (
          <div key={schema} className="flex items-center gap-x-2">
            <Checkbox
              id={`warehouse-schema-${schema}`}
              checked={includedSet.has(schema)}
              disabled={disabled}
              onCheckedChange={(checked) => onToggle(schema, checked === true)}
            />
            <Label htmlFor={`warehouse-schema-${schema}`} className="text-sm font-normal">
              {schema}
            </Label>
          </div>
        ))}
        {replicableSchemas.length === 0 && (
          <p className="text-sm text-foreground-light">No replicable schemas found.</p>
        )}
      </div>
    </div>
  )

  if (variant === 'form') {
    return (
      <FormItemLayout isReactForm={false} layout="horizontal" label="Replicated schemas">
        {schemaList}
      </FormItemLayout>
    )
  }

  return (
    <div className="flex flex-col gap-y-3">
      <div>
        <p className="text-sm text-foreground">Replicated schemas</p>
        <p className="text-sm text-foreground-light">
          Tables in selected schemas are replicated to Warehouse with the same schema and table
          names.
        </p>
      </div>
      {schemaList}
    </div>
  )
}
