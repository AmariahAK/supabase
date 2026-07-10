import { useEffect, useMemo } from 'react'
import type { UseFormReturn } from 'react-hook-form'
import { FormControl, FormField, Select, SelectContent, SelectItem, SelectTrigger } from 'ui'
import { FormItemLayout } from 'ui-patterns/form/FormItemLayout/FormItemLayout'
import { MultiSelector } from 'ui-patterns/multi-select'

import type { DestinationPanelSchemaType } from './DestinationForm.schema'
import type { ReplicationPublication } from '@/data/replication/publications-query'
import type { TablesData } from '@/data/tables/tables-query'

type TableCopySelectionProps = {
  form: UseFormReturn<DestinationPanelSchemaType>
  publications: ReplicationPublication[]
  tables?: TablesData
  isLoadingTables: boolean
}

const isSelectiveMode = (mode: DestinationPanelSchemaType['tableSyncCopyMode']) =>
  mode === 'include_tables' || mode === 'skip_tables'

export const TableCopySelection = ({
  form,
  publications,
  tables = [],
  isLoadingTables,
}: TableCopySelectionProps) => {
  const { publicationName, tableSyncCopyMode, tableSyncCopyTables } = form.watch()

  const publicationTables = useMemo(() => {
    const publication = publications.find(({ name }) => name === publicationName)
    const tableIdsByName = new Map(
      tables.map((table) => [`${table.schema}.${table.name}`, Number(table.id)])
    )

    return (publication?.tables ?? [])
      .map((table) => {
        const qualifiedName = `${table.schema}.${table.name}`
        return { qualifiedName, id: tableIdsByName.get(qualifiedName) }
      })
      .sort((a, b) => a.qualifiedName.localeCompare(b.qualifiedName))
  }, [publicationName, publications, tables])

  useEffect(() => {
    if (!publications.some(({ name }) => name === publicationName)) return

    const availableTables = new Set(publicationTables.map(({ qualifiedName }) => qualifiedName))
    const nextTables = tableSyncCopyTables.filter((table) => availableTables.has(table))

    if (nextTables.length !== tableSyncCopyTables.length) {
      form.setValue('tableSyncCopyTables', nextTables, { shouldDirty: true, shouldValidate: true })
    }
  }, [form, publicationName, publicationTables, publications, tableSyncCopyTables])

  const selectedCount = tableSyncCopyTables.length
  const tableCount = publicationTables.length
  const unresolvedTableCount = publicationTables.filter(({ id }) => id === undefined).length

  return (
    <div className="flex flex-col gap-y-4">
      <FormField
        control={form.control}
        name="tableSyncCopyMode"
        render={({ field }) => (
          <FormItemLayout
            layout="horizontal"
            label="Initial table copy"
            description="Choose which existing rows to copy before change streaming begins. All publication tables continue streaming new changes."
          >
            <FormControl>
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger>
                  {field.value === 'include_all_tables' && 'Copy all tables'}
                  {field.value === 'skip_all_tables' && 'Skip all table copies'}
                  {field.value === 'include_tables' && 'Copy only selected tables'}
                  {field.value === 'skip_tables' && 'Skip selected table copies'}
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="include_all_tables" className="[&>span]:top-2.5">
                    <p>Copy all tables</p>
                    <p className="text-foreground-lighter">Copy existing rows from every table.</p>
                  </SelectItem>
                  <SelectItem value="skip_tables" className="[&>span]:top-2.5">
                    <p>Skip selected table copies</p>
                    <p className="text-foreground-lighter">
                      Stream selected tables without copying existing rows.
                    </p>
                  </SelectItem>
                  <SelectItem value="include_tables" className="[&>span]:top-2.5">
                    <p>Copy only selected tables</p>
                    <p className="text-foreground-lighter">
                      Only copy existing rows from selected tables.
                    </p>
                  </SelectItem>
                  <SelectItem value="skip_all_tables" className="[&>span]:top-2.5">
                    <p>Skip all table copies</p>
                    <p className="text-foreground-lighter">
                      Start streaming without copying any existing rows.
                    </p>
                  </SelectItem>
                </SelectContent>
              </Select>
            </FormControl>
          </FormItemLayout>
        )}
      />

      {isSelectiveMode(tableSyncCopyMode) && (
        <FormField
          control={form.control}
          name="tableSyncCopyTables"
          render={({ field }) => (
            <FormItemLayout
              layout="horizontal"
              label={tableSyncCopyMode === 'skip_tables' ? 'Tables to skip' : 'Tables to copy'}
              description={
                tableSyncCopyMode === 'skip_tables'
                  ? `${selectedCount} of ${tableCount} publication tables will stream without an initial copy.`
                  : `${selectedCount} of ${tableCount} publication tables will have their existing rows copied.`
              }
            >
              <FormControl>
                <MultiSelector
                  values={field.value}
                  onValuesChange={field.onChange}
                  disabled={isLoadingTables || !publicationName || tableCount === 0}
                >
                  <MultiSelector.Trigger
                    badgeLimit={2}
                    label={
                      isLoadingTables
                        ? 'Loading publication tables...'
                        : publicationName
                          ? 'Select tables...'
                          : 'Select a publication first'
                    }
                  />
                  <MultiSelector.Content>
                    <MultiSelector.List>
                      {publicationTables.map(({ qualifiedName, id }) => (
                        <MultiSelector.Item
                          key={qualifiedName}
                          value={qualifiedName}
                          disabled={id === undefined}
                        >
                          <div className="flex w-full items-center justify-between gap-2">
                            <span>{qualifiedName}</span>
                            {id === undefined && (
                              <span className="text-foreground-lighter">ID unavailable</span>
                            )}
                          </div>
                        </MultiSelector.Item>
                      ))}
                    </MultiSelector.List>
                  </MultiSelector.Content>
                </MultiSelector>
              </FormControl>
              {unresolvedTableCount > 0 && !isLoadingTables && (
                <p className="mt-2 text-xs text-warning">
                  {unresolvedTableCount} publication table{' '}
                  {unresolvedTableCount === 1 ? 'is' : 'are'} missing a table ID and cannot be
                  selected.
                </p>
              )}
            </FormItemLayout>
          )}
        />
      )}
    </div>
  )
}
