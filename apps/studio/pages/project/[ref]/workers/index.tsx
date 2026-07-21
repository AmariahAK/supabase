import { useEffect, useState, type PropsWithChildren } from 'react'
import { PageContainer } from 'ui-patterns/PageContainer'
import {
  PageHeader,
  PageHeaderDescription,
  PageHeaderMeta,
  PageHeaderSummary,
  PageHeaderTitle,
} from 'ui-patterns/PageHeader'
import { PageSection, PageSectionContent } from 'ui-patterns/PageSection'

import { CreateWorkerDialog } from '@/components/interfaces/Workers/CreateWorkerDialog'
import { WorkersEmptyState } from '@/components/interfaces/Workers/WorkersEmptyState'
import { WorkersList } from '@/components/interfaces/Workers/WorkersList'
import { DefaultLayout } from '@/components/layouts/DefaultLayout'
import WorkersLayout from '@/components/layouts/WorkersLayout/WorkersLayout'
import { PRODUCT_NAME } from '@/lib/constants/workers'
import { ensureWorkersMockTicker, useWorkersFleet } from '@/state/workers-mock-state'
import type { NextPageWithLayout } from '@/types'

const WorkersPage: NextPageWithLayout = () => {
  const workers = useWorkersFleet()
  const [isCreateOpen, setIsCreateOpen] = useState(false)

  useEffect(() => {
    ensureWorkersMockTicker()
  }, [])

  return (
    <PageContainer size="large">
      <PageSection>
        <PageSectionContent>
          {workers.length > 0 ? (
            <WorkersList workers={workers} onCreate={() => setIsCreateOpen(true)} />
          ) : (
            <WorkersEmptyState onCreate={() => setIsCreateOpen(true)} />
          )}
        </PageSectionContent>
      </PageSection>

      <CreateWorkerDialog visible={isCreateOpen} onClose={() => setIsCreateOpen(false)} />
    </PageContainer>
  )
}

// Hoisted so the TanStack route can import it directly (mirrors the Edge
// Functions index page). Renders the page-level header above the content.
export const WorkersIndexPageWrapper = ({ children }: PropsWithChildren) => (
  <div className="flex min-h-full w-full flex-col items-stretch">
    <PageHeader size="large">
      <PageHeaderMeta>
        <PageHeaderSummary>
          <PageHeaderTitle>{PRODUCT_NAME}</PageHeaderTitle>
          <PageHeaderDescription>
            Run managed compute in microVMs next to your database
          </PageHeaderDescription>
        </PageHeaderSummary>
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
