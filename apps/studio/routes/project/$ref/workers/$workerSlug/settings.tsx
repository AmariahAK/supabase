import { createFileRoute } from '@tanstack/react-router'

import WorkerSettingsPage from '@/pages/project/[ref]/workers/[workerSlug]/settings'

export const Route = createFileRoute('/project/$ref/workers/$workerSlug/settings')({
  component: WorkerSettingsRoute,
  staticData: {
    workerDetailsTitle: 'Settings',
  },
})

function WorkerSettingsRoute() {
  return <WorkerSettingsPage dehydratedState={undefined} />
}
