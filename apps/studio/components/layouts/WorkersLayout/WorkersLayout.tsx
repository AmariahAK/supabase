import { useParams } from 'common'
import { useRouter } from 'next/router'
import { useMemo, type ComponentProps, type PropsWithChildren } from 'react'

import { ProjectLayout } from '../ProjectLayout'
import { ProductMenu } from '@/components/ui/ProductMenu'
import type { ProductMenuGroup } from '@/components/ui/ProductMenu/ProductMenu.types'
import { ProductMenuShortcuts } from '@/components/ui/ProductMenu/ProductMenuShortcuts'
import { withAuth } from '@/hooks/misc/withAuth'
import { PRODUCT_NAME } from '@/lib/constants/workers'

const useGenerateWorkersMenu = (): ProductMenuGroup[] => {
  const { ref: projectRef = 'default' } = useParams()

  return useMemo(
    () => [
      {
        title: 'Manage',
        items: [
          {
            name: PRODUCT_NAME,
            key: 'main',
            // `[workerSlug]` keeps the nav item highlighted on detail pages.
            pages: ['', '[workerSlug]'],
            url: `/project/${projectRef}/workers`,
            items: [],
          },
        ],
      },
    ],
    [projectRef]
  )
}

export const WorkersProductMenu = () => {
  const router = useRouter()
  const page = router.pathname.split('/')[4]
  const menu = useGenerateWorkersMenu()

  return <ProductMenu page={page} menu={menu} />
}

interface WorkersLayoutProps {
  title: string
  browserTitle?: ComponentProps<typeof ProjectLayout>['browserTitle']
}

const WorkersLayout = ({ children, title, browserTitle }: PropsWithChildren<WorkersLayoutProps>) => {
  const menu = useGenerateWorkersMenu()

  return (
    <ProjectLayout
      product={PRODUCT_NAME}
      browserTitle={{ ...browserTitle, section: title }}
      productMenu={<WorkersProductMenu />}
      isBlocking={false}
    >
      <ProductMenuShortcuts menu={menu} />
      {children}
    </ProjectLayout>
  )
}

export default withAuth(WorkersLayout)
