import { createFileRoute } from '@tanstack/react-router'

import WorkerLogsPage from '@/pages/project/[ref]/workers/[workerSlug]/logs'

export const Route = createFileRoute('/project/$ref/workers/$workerSlug/logs')({
  component: WorkerLogsRoute,
  staticData: {
    workerDetailsTitle: 'Logs',
  },
})

function WorkerLogsRoute() {
  return <WorkerLogsPage dehydratedState={undefined} />
}
