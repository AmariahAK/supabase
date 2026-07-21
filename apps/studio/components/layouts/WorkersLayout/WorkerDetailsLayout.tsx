import { useParams } from 'common'
import { Lock } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { useEffect, type PropsWithChildren } from 'react'
import {
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
  NavMenu,
  NavMenuItem,
} from 'ui'
import { Admonition } from 'ui-patterns/admonition'
import { PageBreadcrumbs, PageBreadcrumbsActions } from 'ui-patterns/PageBreadcrumbs'
import { PageContainer } from 'ui-patterns/PageContainer'
import {
  PageHeader,
  PageHeaderDescription,
  PageHeaderMeta,
  PageHeaderNavigationTabs,
  PageHeaderSummary,
  PageHeaderTitle,
} from 'ui-patterns/PageHeader'

import WorkersLayout from './WorkersLayout'
import { WorkerActions } from '@/components/interfaces/Workers/WorkerActions'
import {
  WorkerAccessBadge,
  WorkerConfigBadges,
  WorkerRuntimeBadge,
  WorkerStateBadge,
} from '@/components/interfaces/Workers/WorkerBadges'
import CopyButton from '@/components/ui/CopyButton'
import { withAuth } from '@/hooks/misc/withAuth'
import { PRODUCT_NAME, WORKER_ACCESS_MODES } from '@/lib/constants/workers'
import { ensureWorkersMockTicker, useWorkerBySlug } from '@/state/workers-mock-state'

interface WorkerDetailsLayoutProps {
  title: string
}

const WorkerDetailsLayout = ({ title, children }: PropsWithChildren<WorkerDetailsLayoutProps>) => {
  const router = useRouter()
  const { ref, workerSlug } = useParams()
  const worker = useWorkerBySlug(workerSlug)

  useEffect(() => {
    ensureWorkersMockTicker()
  }, [])

  // If the worker can't be found (e.g. just deleted), bounce to the list.
  useEffect(() => {
    if (workerSlug && !worker) {
      router.push(`/project/${ref}/workers`)
    }
  }, [workerSlug, worker, ref, router])

  const browserTitle = { entity: worker?.name ?? workerSlug, section: title }

  if (!worker) {
    return <WorkersLayout title={title} browserTitle={browserTitle} />
  }

  // Primary tab is mode-dependent: public workers lead on Requests, private on
  // Logs. Terminal and Filesystem give a live shell / file view (gated on the
  // worker running). Private workers have no Requests tab (there's no endpoint).
  const base = `/project/${ref}/workers/${worker.slug}`
  const navigationItems = [
    ...(worker.access === 'public'
      ? [
          { label: 'Requests', href: base },
          { label: 'Activity', href: `${base}/activity` },
        ]
      : [{ label: 'Activity', href: base }]),
    { label: 'Terminal', href: `${base}/terminal` },
    { label: 'Filesystem', href: `${base}/filesystem` },
    { label: 'Container', href: `${base}/container` },
  ]

  return (
    <WorkersLayout title={title} browserTitle={browserTitle}>
      <div className="flex min-h-full w-full flex-col items-stretch">
        <PageBreadcrumbs
          slotClassName="sticky top-0 z-20 bg-dash-sidebar"
          actions={
            <PageBreadcrumbsActions>
              <WorkerActions worker={worker} />
            </PageBreadcrumbsActions>
          }
        >
          <BreadcrumbList className="flex-1 min-w-0 flex-nowrap [&_li]:text-xs">
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link href={`/project/${ref}/workers`}>{PRODUCT_NAME}</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem className="min-w-0">
              <BreadcrumbPage className="block min-w-0 truncate">{worker.name}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </PageBreadcrumbs>

        <PageHeader size="full">
          <PageHeaderMeta>
            <PageHeaderSummary>
              <PageHeaderTitle>{worker.name}</PageHeaderTitle>
              <PageHeaderDescription className="flex flex-row flex-wrap items-center gap-x-3 gap-y-1 text-sm!">
                <WorkerStateBadge state={worker.state} />
                <WorkerRuntimeBadge runtime={worker.runtime} />
                <WorkerAccessBadge access={worker.access} />
                <WorkerConfigBadges worker={worker} />
              </PageHeaderDescription>
            </PageHeaderSummary>
          </PageHeaderMeta>

          {/* Access-mode explainer lives in the shared header so it's visible
              regardless of which tab is open. Wrapped in PageContainer so it
              shares the header's horizontal padding rather than bleeding to the
              edges. */}
          <PageContainer size="full">
            {worker.access === 'public' && worker.endpoint ? (
              <Admonition type="default" title="Public endpoint">
                <div className="mt-1 flex items-center gap-2">
                  <code className="min-w-0 flex-1 truncate text-xs text-foreground">
                    {worker.endpoint}
                  </code>
                  <CopyButton iconOnly variant="text" text={worker.endpoint} />
                </div>
                <p className="mt-2 flex items-center gap-1.5 text-xs text-foreground-lighter">
                  <Lock size={12} strokeWidth={1.5} />
                  Requests must carry a valid Supabase Auth key, validated at the API Gateway.
                </p>
              </Admonition>
            ) : (
              <Admonition
                type="default"
                title="No endpoint"
                description={WORKER_ACCESS_MODES.private.description}
              />
            )}
          </PageContainer>

          <PageHeaderNavigationTabs>
            <NavMenu>
              {navigationItems.map((item) => {
                const isActive = router.asPath.split('?')[0] === item.href
                return (
                  <NavMenuItem key={item.label} active={isActive}>
                    <Link href={item.href}>{item.label}</Link>
                  </NavMenuItem>
                )
              })}
            </NavMenu>
          </PageHeaderNavigationTabs>
        </PageHeader>

        {children}
      </div>
    </WorkersLayout>
  )
}

export default withAuth(WorkerDetailsLayout)
