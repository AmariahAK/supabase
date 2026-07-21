import { Button } from 'ui'

import {
  AccountRow,
  FigmaLogo,
  InterstitialShell,
  LogoPair,
  SignOutButton,
  SupabaseLogo,
} from './connect-interstitial-shared'

export default function ConnectInterstitialLogoUploaded() {
  return (
    <InterstitialShell
      logo={<LogoPair left={<FigmaLogo forceLight />} right={<SupabaseLogo forceLight />} />}
      title="Authorize Figma"
      description="Figma is requesting access to your organization"
    >
      <div className="flex flex-col gap-4">
        <AccountRow displayName="alex@example.com" action={<SignOutButton />} />
        <Button variant="primary" block>
          Authorize Figma
        </Button>
      </div>
    </InterstitialShell>
  )
}
