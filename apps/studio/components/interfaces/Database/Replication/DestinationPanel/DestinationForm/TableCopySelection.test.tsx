import { render, screen } from '@testing-library/react'
import { useForm } from 'react-hook-form'
import { Form } from 'ui'
import { describe, expect, it } from 'vitest'

import type { DestinationPanelSchemaType } from './DestinationForm.schema'
import { TableCopySelection } from './TableCopySelection'
import type { ReplicationPublication } from '@/data/replication/publications-query'

const publications: ReplicationPublication[] = [
  {
    name: 'analytics',
    tables: [
      { id: 101, schema: 'public', name: 'orders' },
      { id: 202, schema: 'billing', name: 'invoices' },
    ],
  },
]

const TableCopySelectionHarness = ({
  editMode,
  mode = 'include_all_tables',
  selectedTableIds = [],
  isErrorPublications = false,
  isLoadingPublications = false,
}: {
  editMode: boolean
  mode?: DestinationPanelSchemaType['tableSyncCopyMode']
  selectedTableIds?: string[]
  isErrorPublications?: boolean
  isLoadingPublications?: boolean
}) => {
  const form = useForm<DestinationPanelSchemaType>({
    defaultValues: {
      name: 'Analytics',
      publicationName: 'analytics',
      tableSyncCopyMode: mode,
      tableSyncCopyTableIds: selectedTableIds,
    },
  })

  return (
    <Form {...form}>
      <TableCopySelection
        form={form}
        publications={publications}
        isLoadingPublications={isLoadingPublications}
        isErrorPublications={isErrorPublications}
        editMode={editMode}
      />
    </Form>
  )
}

describe('TableCopySelection', () => {
  it('explains that editing the policy does not recopy synchronized tables', () => {
    render(<TableCopySelectionHarness editMode />)

    expect(
      screen.getByText(/does not immediately re-copy tables that have completed their initial sync/)
    ).toBeInTheDocument()
  })

  it('does not show the edit-mode explanation while creating a pipeline', () => {
    render(<TableCopySelectionHarness editMode={false} />)

    expect(screen.queryByText(/does not immediately re-copy tables/)).not.toBeInTheDocument()
  })

  it('summarizes selective copy choices against the publication table count', () => {
    render(
      <TableCopySelectionHarness
        editMode={false}
        mode="include_tables"
        selectedTableIds={['101']}
      />
    )

    expect(
      screen.getByText('1 of 2 publication tables will have their existing rows copied.')
    ).toBeInTheDocument()
  })

  it('blocks selection and explains when publication tables cannot be loaded', () => {
    render(
      <TableCopySelectionHarness
        editMode
        mode="include_tables"
        selectedTableIds={['101']}
        isErrorPublications
      />
    )

    expect(screen.getByText(/Publication tables could not be loaded/)).toBeInTheDocument()
    expect(screen.queryByText(/previously selected table/)).not.toBeInTheDocument()
  })

  it('disables selective table choices while publication tables are loading', () => {
    render(
      <TableCopySelectionHarness
        editMode
        mode="include_tables"
        selectedTableIds={['101', '999']}
        isLoadingPublications
      />
    )

    const loadingLabel = screen.getByText('Loading publication tables...')
    expect(loadingLabel).toBeInTheDocument()
    expect(loadingLabel.closest('button')).toBeDisabled()
    expect(screen.queryByText(/previously selected table/)).not.toBeInTheDocument()
  })
})
