import { useParams } from 'common'

import { WorkerTerminalTab } from '@/components/interfaces/Workers/WorkerDetail/WorkerTerminalTab'
import { DefaultLayout } from '@/components/layouts/DefaultLayout'
import WorkerDetailsLayout from '@/components/layouts/WorkersLayout/WorkerDetailsLayout'
import { useWorkerBySlug } from '@/state/workers-mock-state'
import type { NextPageWithLayout } from '@/types'

const WorkerTerminalPage: NextPageWithLayout = () => {
  const { workerSlug } = useParams()
  const worker = useWorkerBySlug(workerSlug)

  if (!worker) return null

  return <WorkerTerminalTab worker={worker} />
}

WorkerTerminalPage.getLayout = (page) => (
  <DefaultLayout>
    <WorkerDetailsLayout title="Terminal">{page}</WorkerDetailsLayout>
  </DefaultLayout>
)

export default WorkerTerminalPage
