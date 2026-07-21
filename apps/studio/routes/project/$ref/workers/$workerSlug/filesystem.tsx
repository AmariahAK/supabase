import { createFileRoute } from '@tanstack/react-router'

import WorkerFilesystemPage from '@/pages/project/[ref]/workers/[workerSlug]/filesystem'

export const Route = createFileRoute('/project/$ref/workers/$workerSlug/filesystem')({
  component: WorkerFilesystemRoute,
  staticData: {
    workerDetailsTitle: 'Filesystem',
  },
})

function WorkerFilesystemRoute() {
  return <WorkerFilesystemPage dehydratedState={undefined} />
}
