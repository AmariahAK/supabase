import { createFileRoute } from '@tanstack/react-router'

import WorkerContainerPage from '@/pages/project/[ref]/workers/[workerSlug]/container'

export const Route = createFileRoute('/project/$ref/workers/$workerSlug/container')({
  component: WorkerContainerRoute,
  staticData: {
    workerDetailsTitle: 'Container',
  },
})

function WorkerContainerRoute() {
  return <WorkerContainerPage dehydratedState={undefined} />
}
