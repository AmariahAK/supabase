import { useMemo } from 'react'
import type { UseFormReturn } from 'react-hook-form'
import { FormControl, FormField, Select, SelectContent, SelectItem, SelectTrigger } from 'ui'
import { Admonition } from 'ui-patterns/admonition'
import { FormItemLayout } from 'ui-patterns/form/FormItemLayout/FormItemLayout'
import { MultiSelector } from 'ui-patterns/multi-select'

import { getPublicationTableIds } from './DestinationForm.utils'
import type { DestinationPanelSchemaType } from './DestinationForm.schema'
import type { ReplicationPublication } from '@/data/replication/publications-query'

type TableCopySelectionProps = {
  form: UseFormReturn<DestinationPanelSchemaType>
  publications: ReplicationPublication[]
  isLoadingPublications: boolean
}

const isSelectiveMode = (mode: DestinationPanelSchemaType['tableSyncCopyMode']) =>
  mode === 'include_tables' || mode === 'skip_tables'

const tableLabel = ({ schema, name }: { schema: string; name: string }) => `${schema}.${name}`

export const TableCopySelection = ({
  form,
  publications,
  isLoadingPublications,
}: TableCopySelectionProps) => {
  const { publicationName, tableSyncCopyMode, tableSyncCopyTableIds } = form.watch()

  // Only publication tables are ever selectable or displayed by name. A table
  // id is never resolved outside of the publication response — there's no
  // other source for a name to come from without a separate, source-wide
  // catalog fetch, which selective table-copy doesn't need.
  const publicationTables = useMemo(() => {
    const publication = publications.find(({ name }) => name === publicationName)
    return [...(publication?.tables ?? [])].sort((a, b) =>
      tableLabel(a).localeCompare(tableLabel(b))
    )
  }, [publicationName, publications])

  const publicationTableIds = useMemo(
    () => getPublicationTableIds(publications, publicationName),
    [publications, publicationName]
  )
  const tableLabelsById = new Map(
    publicationTables.map((table) => [String(table.id), tableLabel(table)])
  )
  const selectedPublicationCount = tableSyncCopyTableIds.filter((id) =>
    publicationTableIds.has(id)
  ).length
  const staleSelectedCount = tableSyncCopyTableIds.filter(
    (id) => !publicationTableIds.has(id)
  ).length
  const tableCount = publicationTables.length

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
          name="tableSyncCopyTableIds"
          render={({ field }) => (
            <FormItemLayout
              layout="horizontal"
              label={tableSyncCopyMode === 'skip_tables' ? 'Tables to skip' : 'Tables to copy'}
              description={
                tableSyncCopyMode === 'skip_tables'
                  ? `${selectedPublicationCount} of ${tableCount} publication tables will stream without an initial copy.`
                  : `${selectedPublicationCount} of ${tableCount} publication tables will have their existing rows copied.`
              }
            >
              <FormControl>
                <MultiSelector
                  values={field.value}
                  onValuesChange={field.onChange}
                  disabled={isLoadingPublications || !publicationName || tableCount === 0}
                >
                  <MultiSelector.Trigger
                    badgeLimit={2}
                    renderValue={(id) => tableLabelsById.get(id) ?? `Table ${id}`}
                    label={
                      isLoadingPublications
                        ? 'Loading publication tables...'
                        : publicationName
                          ? 'Select tables...'
                          : 'Select a publication first'
                    }
                  />
                  <MultiSelector.Content>
                    <MultiSelector.List>
                      {publicationTables.map((table) => (
                        <MultiSelector.Item key={table.id} value={String(table.id)}>
                          {tableLabel(table)}
                        </MultiSelector.Item>
                      ))}
                    </MultiSelector.List>
                  </MultiSelector.Content>
                </MultiSelector>
              </FormControl>
              {staleSelectedCount > 0 && (
                <Admonition type="warning" className="mt-2">
                  <p className="leading-normal!">
                    {staleSelectedCount === 1
                      ? 'A previously selected table is'
                      : `${staleSelectedCount} previously selected tables are`}{' '}
                    no longer in this publication. {staleSelectedCount === 1 ? 'It' : 'They'} will
                    be excluded from this pipeline's initial-copy configuration when you save.
                  </p>
                </Admonition>
              )}
            </FormItemLayout>
          )}
        />
      )}
    </div>
  )
}
