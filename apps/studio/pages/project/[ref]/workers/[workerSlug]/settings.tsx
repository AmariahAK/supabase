import { useParams } from 'common'

import { WorkerSettingsTab } from '@/components/interfaces/Workers/WorkerDetail/WorkerSettingsTab'
import { DefaultLayout } from '@/components/layouts/DefaultLayout'
import WorkerDetailsLayout from '@/components/layouts/WorkersLayout/WorkerDetailsLayout'
import { useWorkerBySlug } from '@/state/workers-mock-state'
import type { NextPageWithLayout } from '@/types'

const WorkerSettingsPage: NextPageWithLayout = () => {
  const { workerSlug } = useParams()
  const worker = useWorkerBySlug(workerSlug)

  if (!worker) return null

  return <WorkerSettingsTab worker={worker} />
}

WorkerSettingsPage.getLayout = (page) => (
  <DefaultLayout>
    <WorkerDetailsLayout title="Settings">{page}</WorkerDetailsLayout>
  </DefaultLayout>
)

export default WorkerSettingsPage
