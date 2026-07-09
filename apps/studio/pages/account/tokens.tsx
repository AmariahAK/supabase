import { useFlag } from 'common'
import { ExternalLink, Search } from 'lucide-react'
import { useState } from 'react'
import { Button } from 'ui'
import { Input } from 'ui-patterns/DataInputs/Input'

import { AccessTokenList } from '@/components/interfaces/Account/AccessTokens/AccessTokenList'
import { AccessTokenNewBanner } from '@/components/interfaces/Account/AccessTokens/AccessTokenNewBanner/AccessTokenNewBanner'
import { NewTokenButton } from '@/components/interfaces/Account/AccessTokens/Classic/NewTokenButton'
import { MigrationAdmonition } from '@/components/interfaces/Account/AccessTokens/MigrationAdmonition'
import { NewScopedTokenButton } from '@/components/interfaces/Account/AccessTokens/Scoped/NewScopedTokenButton'
import { AccessTokensLayout } from '@/components/layouts/AccessTokens/AccessTokensLayout'
import AccountLayout from '@/components/layouts/AccountLayout/AccountLayout'
import { AppLayout } from '@/components/layouts/AppLayout/AppLayout'
import { DefaultLayout } from '@/components/layouts/DefaultLayout'
import { NewAccessToken } from '@/data/access-tokens/access-tokens-create-mutation'
import { DOCS_URL } from '@/lib/constants'
import type { NextPageWithLayout } from '@/types'

const UserAccessTokens: NextPageWithLayout = () => {
  const scopedTokensEnabled = useFlag('scopedPAT')
  const [newToken, setNewToken] = useState<NewAccessToken | undefined>()
  const [searchString, setSearchString] = useState('')

  return (
    <AccessTokensLayout>
      <div className="space-y-4">
        {scopedTokensEnabled && <MigrationAdmonition />}

        {newToken && (
          <AccessTokenNewBanner
            token={newToken}
            onClose={() => setNewToken(undefined)}
            getTokenValue={(token) => token.token}
          />
        )}

        <div>
          <h3 className="text-sm text-foreground">Tokens</h3>
          <p className="text-xs text-foreground-light">
            Personal access tokens for the Management API and CLI.
          </p>
        </div>

        <div className="flex items-center justify-between gap-x-2 mb-3">
          <Input
            size="tiny"
            autoComplete="off"
            icon={<Search size={12} />}
            value={searchString}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchString(e.target.value)}
            name="search"
            id="search"
            placeholder="Filter tokens"
          />
          <div className="flex items-center gap-x-2">
            <Button asChild variant="default" icon={<ExternalLink />}>
              <a href={`${DOCS_URL}/reference/api/introduction`} target="_blank" rel="noreferrer">
                API Docs
              </a>
            </Button>
            <Button asChild variant="default" icon={<ExternalLink />}>
              <a href={`${DOCS_URL}/reference/cli/start`} target="_blank" rel="noreferrer">
                CLI docs
              </a>
            </Button>
            {scopedTokensEnabled ? (
              <>
                {/* TODO(product): classic minting kept as a secondary action per the migration plan. */}
                <NewTokenButton
                  onCreateToken={setNewToken}
                  label="Classic token"
                  variant="default"
                />
                <NewScopedTokenButton onCreateToken={() => {}} />
              </>
            ) : (
              <NewTokenButton onCreateToken={setNewToken} />
            )}
          </div>
        </div>

        <AccessTokenList
          searchString={searchString}
          scopedEnabled={scopedTokensEnabled}
          onDeleteSuccess={(id) => {
            if (id === newToken?.id) setNewToken(undefined)
          }}
        />
      </div>
    </AccessTokensLayout>
  )
}

UserAccessTokens.getLayout = (page) => (
  <AppLayout>
    <DefaultLayout headerTitle="Account">
      <AccountLayout title="Access Tokens">{page}</AccountLayout>
    </DefaultLayout>
  </AppLayout>
)

export default UserAccessTokens
