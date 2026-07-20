import { render, screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { Admonition, type AdmonitionProps } from './index'

const stringDescriptionProps = {
  description: 'Description-only copy.',
} satisfies AdmonitionProps

const invalidLabelProps = {
  // @ts-expect-error label was removed; use title instead.
  label: 'Legacy heading',
  description: 'Body copy.',
} satisfies AdmonitionProps

void stringDescriptionProps
void invalidLabelProps

describe('Admonition', () => {
  it('renders a bold type label for description-only content', () => {
    render(<Admonition type="default" description="Changes can take a few minutes to apply." />)

    const note = screen.getByRole('note')
    const label = within(note).getByText('Note:')
    expect(label.tagName).toBe('STRONG')
    expect(label).toBeVisible()
    expect(note).toHaveTextContent('Note: Changes can take a few minutes to apply.')
  })

  it('renders children-only rich MDX-like content with a Note label', () => {
    render(
      <Admonition type="note">
        <p>
          This is a Postgres{' '}
          <a href="/docs/guides/database/postgres/row-level-security">SECURITY DEFINER</a> function.
        </p>
        <ul>
          <li>Keep privileges scoped.</li>
        </ul>
      </Admonition>
    )

    const note = screen.getByRole('note')
    expect(within(note).getByText('Note:').tagName).toBe('STRONG')
    expect(within(note).getByText('SECURITY DEFINER')).toHaveAttribute(
      'href',
      '/docs/guides/database/postgres/row-level-security'
    )
    expect(within(note).getByText('Keep privileges scoped.')).toBeVisible()
  })

  it('renders a Warning label with title and description', () => {
    render(
      <Admonition
        type="warning"
        title="Manual approval required"
        description="Review the pending changes before continuing."
      />
    )

    const note = screen.getByRole('note')
    const label = within(note).getByText('Warning:')
    expect(label.tagName).toBe('STRONG')
    expect(label.parentElement).toHaveTextContent('Warning: Manual approval required')
    expect(note.querySelector('h1, h2, h3, h4, h5, h6')).not.toBeInTheDocument()
    expect(note).toHaveTextContent('Review the pending changes before continuing.')
  })

  it('renders a Caution label with title and children', () => {
    render(
      <Admonition type="caution" title="Security definer function">
        <p>Review ownership before exposing this function.</p>
      </Admonition>
    )

    const note = screen.getByRole('note')
    expect(within(note).getByText('Caution:').tagName).toBe('STRONG')
    expect(note).toHaveTextContent('Caution: Security definer function')
    expect(note.querySelector('h1, h2, h3, h4, h5, h6')).not.toBeInTheDocument()
    expect(note).toHaveTextContent('Review ownership before exposing this function.')
  })

  it('renders a Success label with success styling', () => {
    render(
      <Admonition
        type="success"
        title="Connection confirmed"
        description="You can now close this tab."
      />
    )

    const note = screen.getByRole('note')
    expect(within(note).getByText('Success:').tagName).toBe('STRONG')
    expect(note).toHaveTextContent('Success: Connection confirmed')
    expect(note).toHaveTextContent('You can now close this tab.')
    expect(note).toHaveClass('bg-brand-400/15')
    expect(note).toHaveClass('border-brand-400')
    expect(note.querySelector('svg path')?.getAttribute('d')).toContain('M10.5 19.5')
  })

  it('renders a Danger label and omits the icon when showIcon is false', () => {
    render(
      <Admonition
        type="destructive"
        showIcon={false}
        title="Deletion blocked"
        description="Resolve dependent resources before retrying."
      />
    )

    const note = screen.getByRole('note')
    expect(within(note).getByText('Danger:').tagName).toBe('STRONG')
    expect(note).toHaveTextContent('Danger: Deletion blocked')
    expect(note.querySelector('svg')).not.toBeInTheDocument()
  })

  it.each([
    ['tip', 'Tip:'],
    ['danger', 'Danger:'],
    ['deprecation', 'Deprecated:'],
  ] as const)('renders the %s type label as %s', (type, label) => {
    render(<Admonition type={type} description="Body copy." />)

    const labelEl = within(screen.getByRole('note')).getByText(label)
    expect(labelEl.tagName).toBe('STRONG')
    expect(labelEl).toBeVisible()
  })
})
