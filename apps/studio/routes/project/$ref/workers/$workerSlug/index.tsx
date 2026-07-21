import { createFileRoute } from '@tanstack/react-router'

import WorkerPrimaryPage from '@/pages/project/[ref]/workers/[workerSlug]/index'

export const Route = createFileRoute('/project/$ref/workers/$workerSlug/')({
  component: WorkerPrimaryRoute,
  staticData: {
    workerDetailsTitle: 'Overview',
  },
})

function WorkerPrimaryRoute() {
  return <WorkerPrimaryPage dehydratedState={undefined} />
}
