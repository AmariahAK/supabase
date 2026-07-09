import { useParams } from 'common'
import { AnalyticsBucket, BigQuery, Database } from 'icons'
import { Snowflake, Warehouse } from 'lucide-react'
import { parseAsInteger, parseAsStringEnum, useQueryState } from 'nuqs'
import type { ElementType } from 'react'
import {
  Badge,
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectSeparator,
  SelectTrigger,
} from 'ui'
import { FormItemLayout } from 'ui-patterns/form/FormItemLayout/FormItemLayout'

import { useDestinationInformation } from '../useDestinationInformation'
import {
  useIsETLBigQueryPrivateAlpha,
  useIsETLDucklakePrivateAlpha,
  useIsETLIcebergPrivateAlpha,
  useIsETLSnowflakePrivateAlpha,
} from '../useIsETLPrivateAlpha'
import { DestinationType } from './DestinationPanel.types'
import { useWarehouseProjectState } from '@/components/interfaces/Database/Warehouse/warehouseDemoStore'
import { InlineLink } from '@/components/ui/InlineLink'
import { useIsFeatureEnabled } from '@/hooks/misc/useIsFeatureEnabled'
import { useIsWarehouseEnabled } from '@/hooks/misc/useIsWarehouseEnabled'

interface DestinationTypeOption {
  value: DestinationType
  label: string
  description: string
  icon: ElementType<{ size?: number; className?: string }>
  isAlpha: boolean
  enabled: boolean
}

interface DestinationTypeGroup {
  label: string
  options: DestinationTypeOption[]
}

const LUCIDE_DESTINATION_TYPES = new Set<DestinationType>(['Warehouse', 'Snowflake'])

function DestinationOptionIcon({ option }: { option: DestinationTypeOption }) {
  const Icon = option.icon
  const className = 'shrink-0 text-foreground-light'

  if (LUCIDE_DESTINATION_TYPES.has(option.value)) {
    return <Icon size={20} strokeWidth={1.5} className={className} />
  }

  return <Icon size={20} className={className} />
}

export const DestinationTypeSelection = () => {
  const { ref: projectRef } = useParams()
  const etlEnableBigQuery = useIsETLBigQueryPrivateAlpha()
  const etlEnableIceberg = useIsETLIcebergPrivateAlpha()
  const etlEnableDucklake = useIsETLDucklakePrivateAlpha()
  const etlEnableSnowflake = useIsETLSnowflakePrivateAlpha()
  const isWarehouseFeatureEnabled = useIsWarehouseEnabled()
  const warehouseState = useWarehouseProjectState(projectRef)
  const { infrastructureReadReplicas } = useIsFeatureEnabled(['infrastructure:read_replicas'])

  const [urlDestinationType, setDestinationType] = useQueryState(
    'destinationType',
    parseAsStringEnum<DestinationType>([
      'Read Replica',
      'Warehouse',
      'BigQuery',
      'Analytics Bucket',
      'DuckLake',
      'Snowflake',
    ]).withOptions({
      history: 'push',
      clearOnDefault: true,
    })
  )

  const [edit] = useQueryState(
    'edit',
    parseAsInteger.withOptions({ history: 'push', clearOnDefault: true })
  )
  const editMode = edit !== null

  const { type: existingDestinationType } = useDestinationInformation({ id: edit })
  const destinationType = existingDestinationType ?? urlDestinationType

  // In edit mode the type is locked, so only surface the option that matches the
  // destination being edited. Otherwise show every type the project has access to.
  const isOptionVisible = (value: DestinationType, hasAccess: boolean) =>
    editMode ? destinationType === value : hasAccess

  const groups: DestinationTypeGroup[] = [
    {
      label: 'Other',
      options: [
        {
          value: 'Read Replica',
          label: 'Read Replica',
          description:
            'Deploy a read-only database in another region for lower latency and workload isolation',
          icon: Database,
          isAlpha: false,
          enabled: isOptionVisible('Read Replica', infrastructureReadReplicas),
        },
      ],
    },
    {
      label: 'Pipelines',
      options: [
        {
          value: 'Warehouse',
          label: 'Warehouse',
          description: 'Replicate to a managed Warehouse endpoint for analytics',
          icon: Warehouse,
          isAlpha: true,
          enabled: isOptionVisible(
            'Warehouse',
            isWarehouseFeatureEnabled && !warehouseState.enabled
          ),
        },
        {
          value: 'Analytics Bucket',
          label: 'Analytics Bucket',
          description: 'Write Apache Iceberg tables to Supabase Storage for analytics workflows',
          icon: AnalyticsBucket,
          isAlpha: true,
          enabled: isOptionVisible('Analytics Bucket', etlEnableIceberg),
        },
        {
          value: 'BigQuery',
          label: 'BigQuery',
          description: "Stream changes to Google Cloud's data warehouse for analytics and BI",
          icon: BigQuery,
          isAlpha: true,
          enabled: isOptionVisible('BigQuery', etlEnableBigQuery),
        },
        {
          value: 'DuckLake',
          label: 'DuckLake',
          description: 'Stream changes to a DuckLake catalog backed by S3-compatible storage',
          icon: Database,
          isAlpha: true,
          enabled: isOptionVisible('DuckLake', etlEnableDucklake),
        },
        {
          value: 'Snowflake',
          label: 'Snowflake',
          description:
            'Stream changes to Snowflake for warehouse analytics and downstream data workflows',
          icon: Snowflake,
          isAlpha: true,
          enabled: isOptionVisible('Snowflake', etlEnableSnowflake),
        },
      ],
    },
  ]

  const visibleGroups = groups
    .map((group) => ({ ...group, options: group.options.filter((option) => option.enabled) }))
    .filter((group) => group.options.length > 0)

  const selectedOption = visibleGroups
    .flatMap((group) => group.options)
    .find((option) => option.value === destinationType)

  const typeDescription =
    destinationType === 'Warehouse'
      ? 'Replicates your project database into Warehouse for analytical workloads.'
      : editMode
        ? undefined
        : 'Destination type cannot be changed after creation.'

  return (
    <FormItemLayout
      isReactForm={false}
      layout="horizontal"
      className="p-5 [&>div]:gap-y-1 [&>div>span]:text-foreground-lighter"
      label="Type"
      description={typeDescription}
    >
      <Select
        disabled={editMode}
        value={destinationType ?? undefined}
        onValueChange={(value) => setDestinationType(value as DestinationType)}
      >
        <SelectTrigger className="h-auto py-2">
          {selectedOption ? (
            <div className="flex items-center gap-x-3 text-left">
              <DestinationOptionIcon option={selectedOption} />
              <div className="flex items-center gap-x-2">
                <span className="text-sm text-foreground">{selectedOption.label}</span>
                {selectedOption.isAlpha && <Badge variant="warning">Alpha</Badge>}
              </div>
            </div>
          ) : (
            <span className="text-foreground-lighter">Select a destination type</span>
          )}
        </SelectTrigger>
        <SelectContent align="end">
          {visibleGroups.map((group, index) => (
            <SelectGroup key={group.label}>
              {index > 0 && <SelectSeparator />}
              <SelectLabel>{group.label}</SelectLabel>
              {group.options.map((option) => (
                <SelectItem key={option.value} value={option.value} className="py-2">
                  <div className="flex items-center gap-x-3">
                    <DestinationOptionIcon option={option} />
                    <div className="flex flex-col gap-y-0.5">
                      <div className="flex items-center gap-x-2">
                        <span className="text-foreground">{option.label}</span>
                        {option.isAlpha && <Badge variant="warning">Alpha</Badge>}
                      </div>
                      <span className="text-xs text-foreground-lighter">{option.description}</span>
                    </div>
                  </div>
                </SelectItem>
              ))}
            </SelectGroup>
          ))}
        </SelectContent>
      </Select>
    </FormItemLayout>
  )
}
