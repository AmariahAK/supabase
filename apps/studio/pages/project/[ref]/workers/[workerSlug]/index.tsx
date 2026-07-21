import { useParams } from 'common'

import { WorkerLogsTab } from '@/components/interfaces/Workers/WorkerDetail/WorkerLogsTab'
import { WorkerRequestsTab } from '@/components/interfaces/Workers/WorkerDetail/WorkerRequestsTab'
import { DefaultLayout } from '@/components/layouts/DefaultLayout'
import WorkerDetailsLayout from '@/components/layouts/WorkersLayout/WorkerDetailsLayout'
import { useWorkerBySlug } from '@/state/workers-mock-state'
import type { NextPageWithLayout } from '@/types'

// Primary tab. Public workers lead on Requests; private workers (no endpoint)
// lead on Logs — "its logs are its product".
const WorkerPrimaryPage: NextPageWithLayout = () => {
  const { workerSlug } = useParams()
  const worker = useWorkerBySlug(workerSlug)

  if (!worker) return null

  return worker.access === 'public' ? (
    <WorkerRequestsTab worker={worker} />
  ) : (
    <WorkerLogsTab worker={worker} />
  )
}

WorkerPrimaryPage.getLayout = (page) => (
  <DefaultLayout>
    <WorkerDetailsLayout title="Overview">{page}</WorkerDetailsLayout>
  </DefaultLayout>
)

export default WorkerPrimaryPage
