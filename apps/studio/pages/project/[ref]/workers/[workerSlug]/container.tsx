import { useParams } from 'common'

import { WorkerContainerTab } from '@/components/interfaces/Workers/WorkerDetail/WorkerContainerTab'
import { DefaultLayout } from '@/components/layouts/DefaultLayout'
import WorkerDetailsLayout from '@/components/layouts/WorkersLayout/WorkerDetailsLayout'
import { useWorkerBySlug } from '@/state/workers-mock-state'
import type { NextPageWithLayout } from '@/types'

const WorkerContainerPage: NextPageWithLayout = () => {
  const { workerSlug } = useParams()
  const worker = useWorkerBySlug(workerSlug)

  if (!worker) return null

  return <WorkerContainerTab worker={worker} />
}

WorkerContainerPage.getLayout = (page) => (
  <DefaultLayout>
    <WorkerDetailsLayout title="Container">{page}</WorkerDetailsLayout>
  </DefaultLayout>
)

export default WorkerContainerPage
