import { useParams } from 'common'

import { WorkerLogsTab } from '@/components/interfaces/Workers/WorkerDetail/WorkerLogsTab'
import { DefaultLayout } from '@/components/layouts/DefaultLayout'
import WorkerDetailsLayout from '@/components/layouts/WorkersLayout/WorkerDetailsLayout'
import { useWorkerBySlug } from '@/state/workers-mock-state'
import type { NextPageWithLayout } from '@/types'

// Primary tab for every worker: Activity (lifecycle + session-grouped logs,
// including HTTP request lines for public workers).
const WorkerActivityPage: NextPageWithLayout = () => {
  const { workerSlug } = useParams()
  const worker = useWorkerBySlug(workerSlug)

  if (!worker) return null

  return <WorkerLogsTab worker={worker} />
}

WorkerActivityPage.getLayout = (page) => (
  <DefaultLayout>
    <WorkerDetailsLayout title="Activity">{page}</WorkerDetailsLayout>
  </DefaultLayout>
)

export default WorkerActivityPage
