import { createFileRoute } from '@tanstack/react-router'

import WorkersPage, { WorkersIndexPageWrapper } from '@/pages/project/[ref]/workers/index'

export const Route = createFileRoute('/project/$ref/workers/')({
  component: WorkersIndexRoute,
  staticData: {
    workersLayoutTitle: 'Workers',
  },
})

function WorkersIndexRoute() {
  return (
    <WorkersIndexPageWrapper>
      <WorkersPage dehydratedState={undefined} />
    </WorkersIndexPageWrapper>
  )
}
