import { createFileRoute } from '@tanstack/react-router'

import WorkerTerminalPage from '@/pages/project/[ref]/workers/[workerSlug]/terminal'

export const Route = createFileRoute('/project/$ref/workers/$workerSlug/terminal')({
  component: WorkerTerminalRoute,
  staticData: {
    workerDetailsTitle: 'Terminal',
  },
})

function WorkerTerminalRoute() {
  return <WorkerTerminalPage dehydratedState={undefined} />
}
