import { useFeatureFlags, useParams } from 'common'
import { useRouter } from 'next/router'
import { useEffect } from 'react'
import { PageContainer } from 'ui-patterns/PageContainer'
import { PageSection, PageSectionContent } from 'ui-patterns/PageSection'
import { GenericSkeletonLoader } from 'ui-patterns/ShimmeringLoader'

import { INTEGRATION_FLAGS } from '@/components/interfaces/Integrations/Landing/Integrations.constants'
import { DefaultLayout } from '@/components/layouts/DefaultLayout'
import { ProjectIntegrationsLayoutDispatch } from '@/components/layouts/ProjectIntegrationsLayoutDispatch'
import type { NextPageWithLayout } from '@/types'

const IntegrationPage: NextPageWithLayout = () => {
  const router = useRouter()
  const { ref, id } = useParams()
  const featureFlags = useFeatureFlags()

  useEffect(() => {
    if (!router?.isReady) return

    // bounce back to the marketplace so a disabled integration can't be reached by direct URL.
    const flagName = id ? INTEGRATION_FLAGS[id] : undefined
    if (flagName && !(featureFlags.configcat[flagName] ?? false)) {
      router.replace(`/project/${ref}/integrations`)
      return
    }

    router.replace(`/project/${ref}/integrations/${id}/overview`)
  }, [router, ref, id, featureFlags])

  return (
    <PageContainer size="full">
      <PageSection>
        <PageSectionContent>
          <GenericSkeletonLoader />
        </PageSectionContent>
      </PageSection>
    </PageContainer>
  )
}

IntegrationPage.getLayout = (page) => (
  <DefaultLayout>
    <ProjectIntegrationsLayoutDispatch>{page}</ProjectIntegrationsLayoutDispatch>
  </DefaultLayout>
)

export default IntegrationPage
