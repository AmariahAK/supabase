import { useParams } from 'common'

import { WorkerFilesystemTab } from '@/components/interfaces/Workers/WorkerDetail/WorkerFilesystemTab'
import { DefaultLayout } from '@/components/layouts/DefaultLayout'
import WorkerDetailsLayout from '@/components/layouts/WorkersLayout/WorkerDetailsLayout'
import { useWorkerBySlug } from '@/state/workers-mock-state'
import type { NextPageWithLayout } from '@/types'

const WorkerFilesystemPage: NextPageWithLayout = () => {
  const { workerSlug } = useParams()
  const worker = useWorkerBySlug(workerSlug)

  if (!worker) return null

  return <WorkerFilesystemTab worker={worker} />
}

WorkerFilesystemPage.getLayout = (page) => (
  <DefaultLayout>
    <WorkerDetailsLayout title="Filesystem">{page}</WorkerDetailsLayout>
  </DefaultLayout>
)

export default WorkerFilesystemPage
