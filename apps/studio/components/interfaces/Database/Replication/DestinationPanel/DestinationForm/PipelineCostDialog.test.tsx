import { render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { PipelineCostDialog } from './PipelineCostDialog'

const mocks = vi.hoisted(() => {
  const tables = [
    {
      schema: 'public',
      name: 'orders',
      estimated_bytes: 600_000_000,
      estimated_cost: 0.6,
      is_row_filtered: false,
    },
    {
      schema: 'billing',
      name: 'invoices',
      estimated_bytes: 9_400_000_000,
      estimated_cost: 9.4,
      is_row_filtered: false,
    },
  ]

  return {
    tables,
    estimate: {
      currency: 'usd' as const,
      pipeline: { hourly_cost: 0.05, monthly_cost: 36.5 },
      streaming: { rate_per_gb: 3 },
      table_copy: {
        rate_per_gb: 0.6,
        total_bytes: 10_000_000_000,
        total_cost: 10,
        tables: [...tables],
      },
    },
  }
})

vi.mock('@/data/replication/cost-estimate-query', () => ({
  useReplicationCostEstimateQuery: () => ({
    data: mocks.estimate,
    isLoading: false,
    isError: false,
    isSuccess: true,
  }),
}))

const publicationTables = [
  { id: 101, schema: 'public', name: 'orders' },
  { id: 202, schema: 'billing', name: 'invoices' },
]

const renderDialog = (
  tableSyncCopy: { type: 'include_tables'; table_ids: number[] } | { type: 'skip_all_tables' }
) =>
  render(
    <PipelineCostDialog
      open
      isConfirming={false}
      projectRef="project-ref"
      sourceId={42}
      publicationName="analytics"
      publicationTables={publicationTables}
      tableSyncCopy={tableSyncCopy}
      onOpenChange={vi.fn()}
      onConfirm={vi.fn()}
    />
  )

describe('PipelineCostDialog', () => {
  beforeEach(() => {
    mocks.estimate.table_copy.tables = [...mocks.tables]
  })

  it('shows only the initial-copy tables selected by the policy', () => {
    renderDialog({ type: 'include_tables', table_ids: [101] })

    expect(screen.getByText('public.orders')).toBeInTheDocument()
    expect(screen.queryByText('billing.invoices')).not.toBeInTheDocument()
    expect(screen.getAllByText('$0.60')).toHaveLength(3)
    expect(screen.queryByText('$10.00')).not.toBeInTheDocument()
  })

  it('shows a zero initial-copy charge while retaining ongoing rates', () => {
    renderDialog({ type: 'skip_all_tables' })

    expect(screen.getByText(/No tables will be initially copied/)).toBeInTheDocument()
    expect(screen.getByText('$0.00')).toBeInTheDocument()
    expect(screen.getByText('$0.05/hour')).toBeInTheDocument()
    expect(screen.getByText('$3.00/GB')).toBeInTheDocument()
    expect(screen.queryByText('public.orders')).not.toBeInTheDocument()
  })

  it('does not show a partial total when a selected table estimate is missing', () => {
    mocks.estimate.table_copy.tables = [mocks.estimate.table_copy.tables[0]]

    renderDialog({ type: 'include_tables', table_ids: [101, 202] })

    expect(
      screen.getByText(/estimate is unavailable for one or more selected tables/)
    ).toBeInTheDocument()
    expect(screen.getByText('Unavailable')).toBeInTheDocument()
    expect(screen.queryByText('$0.60')).not.toBeInTheDocument()
  })
})
