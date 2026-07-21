import { createFileRoute } from '@tanstack/react-router'

import WorkerActivityPage from '@/pages/project/[ref]/workers/[workerSlug]/activity'

export const Route = createFileRoute('/project/$ref/workers/$workerSlug/activity')({
  component: WorkerActivityRoute,
  staticData: {
    workerDetailsTitle: 'Activity',
  },
})

function WorkerActivityRoute() {
  return <WorkerActivityPage dehydratedState={undefined} />
}
