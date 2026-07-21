import { useEffect, type PropsWithChildren } from 'react'
import { Button } from 'ui'
import { PageContainer } from 'ui-patterns/PageContainer'
import {
  PageHeader,
  PageHeaderAside,
  PageHeaderDescription,
  PageHeaderMeta,
  PageHeaderSummary,
  PageHeaderTitle,
} from 'ui-patterns/PageHeader'
import { PageSection, PageSectionContent } from 'ui-patterns/PageSection'

import { WorkersCockpit } from '@/components/interfaces/Workers/WorkersCockpit'
import { WorkersEmptyState } from '@/components/interfaces/Workers/WorkersEmptyState'
import { DefaultLayout } from '@/components/layouts/DefaultLayout'
import WorkersLayout from '@/components/layouts/WorkersLayout/WorkersLayout'
import { DocsButton } from '@/components/ui/DocsButton'
import { DOCS_URL } from '@/lib/constants'
import { PRODUCT_NAME, UNIT_NAME_PLURAL_LOWER } from '@/lib/constants/workers'
import { ensureWorkersMockTicker, useWorkersFleet } from '@/state/workers-mock-state'
import type { NextPageWithLayout } from '@/types'

const WorkersPage: NextPageWithLayout = () => {
  const workers = useWorkersFleet()

  useEffect(() => {
    ensureWorkersMockTicker()
  }, [])

  return (
    <PageContainer size="full">
      <PageSection>
        <PageSectionContent>
          {workers.length > 0 ? (
            <WorkersCockpit workers={workers} />
          ) : (
            <WorkersEmptyState />
          )}
        </PageSectionContent>
      </PageSection>
    </PageContainer>
  )
}

// Hoisted so the TanStack route can import it directly (mirrors the Edge
// Functions index page). Renders the page-level header above the content.
export const WorkersIndexPageWrapper = ({ children }: PropsWithChildren) => (
  <div className="flex min-h-full w-full flex-col items-stretch">
    <PageHeader size="full">
      <PageHeaderMeta>
        <PageHeaderSummary>
          <PageHeaderTitle>{PRODUCT_NAME}</PageHeaderTitle>
          <PageHeaderDescription>
            Run managed compute in microVMs next to your database
          </PageHeaderDescription>
        </PageHeaderSummary>
        <PageHeaderAside>
          <DocsButton href={`${DOCS_URL}/guides/${UNIT_NAME_PLURAL_LOWER}`} />
          <Button variant="default" disabled>
            Alpha
          </Button>
        </PageHeaderAside>
      </PageHeaderMeta>
    </PageHeader>
    {children}
  </div>
)

WorkersPage.getLayout = (page) => (
  <DefaultLayout>
    <WorkersLayout title={PRODUCT_NAME}>
      <WorkersIndexPageWrapper>{page}</WorkersIndexPageWrapper>
    </WorkersLayout>
  </DefaultLayout>
)

export default WorkersPage
