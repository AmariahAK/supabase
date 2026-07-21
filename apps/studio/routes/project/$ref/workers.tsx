import { createFileRoute, Outlet, useMatches } from '@tanstack/react-router'

import WorkersLayout from '@/components/layouts/WorkersLayout/WorkersLayout'

export const Route = createFileRoute('/project/$ref/workers')({
  component: WorkersShell,
})

type WorkersStaticData = {
  workersLayoutTitle?: string
  // The $workerSlug routes wrap themselves in <WorkerDetailsLayout>, which
  // already renders <WorkersLayout> internally. Without opting out here we'd
  // double-wrap.
  skipWorkersLayout?: boolean
}

function WorkersShell() {
  const skip = useMatches({
    select: (matches) =>
      matches.some((m) => (m.staticData as WorkersStaticData | undefined)?.skipWorkersLayout),
  })
  const title = useMatches({
    select: (matches) =>
      (matches[matches.length - 1]?.staticData as WorkersStaticData | undefined)
        ?.workersLayoutTitle ?? '',
  })

  if (skip) return <Outlet />

  return (
    <WorkersLayout title={title}>
      <Outlet />
    </WorkersLayout>
  )
}
