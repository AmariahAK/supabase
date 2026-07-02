import Link from 'next/link'
import { Button } from 'ui'
import { PageSectionTitle } from 'ui-patterns/PageSection'

interface TableDetailPreviewHeaderProps {
  sqlEditorUrl?: string
}

export function TableDetailPreviewHeader({ sqlEditorUrl }: TableDetailPreviewHeaderProps) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-4">
      <PageSectionTitle className="mb-0">Preview</PageSectionTitle>
      {sqlEditorUrl && (
        <Button asChild variant="default" className="w-fit shrink-0">
          <Link href={sqlEditorUrl}>Query in SQL Editor</Link>
        </Button>
      )}
    </div>
  )
}
