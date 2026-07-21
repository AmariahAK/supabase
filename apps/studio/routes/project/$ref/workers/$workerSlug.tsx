import { createFileRoute, Outlet, useMatches } from '@tanstack/react-router'

import WorkerDetailsLayout from '@/components/layouts/WorkersLayout/WorkerDetailsLayout'

export const Route = createFileRoute('/project/$ref/workers/$workerSlug')({
  component: WorkerDetailsShell,
  // WorkerDetailsLayout already wraps <WorkersLayout> internally. Tell the
  // parent workers.tsx shell to skip its own wrap so we don't double-wrap.
  staticData: {
    skipWorkersLayout: true,
  },
})

function WorkerDetailsShell() {
  const title = useMatches({
    select: (matches) =>
      (matches[matches.length - 1]?.staticData as { workerDetailsTitle?: string } | undefined)
        ?.workerDetailsTitle ?? '',
  })

  return (
    <WorkerDetailsLayout title={title}>
      <Outlet />
    </WorkerDetailsLayout>
  )
}
