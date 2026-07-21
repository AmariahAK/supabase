import { createFileRoute } from '@tanstack/react-router'

import WorkerActivityPage from '@/pages/project/[ref]/workers/[workerSlug]/index'

export const Route = createFileRoute('/project/$ref/workers/$workerSlug/')({
  component: WorkerActivityRoute,
  staticData: {
    workerDetailsTitle: 'Activity',
  },
})

function WorkerActivityRoute() {
  return <WorkerActivityPage dehydratedState={undefined} />
}
