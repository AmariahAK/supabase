import { Button } from 'ui'

import {
  AccountRow,
  InterstitialShell,
  LogoBox,
  LogoPair,
  SignOutButton,
  SupabaseLogo,
} from './connect-interstitial-shared'

/** Stand-in for an organisation OAuth app icon uploaded in Studio. */
function UploadedAppLogo() {
  return (
    <LogoBox className="bg-white">
      <img
        alt="Acme"
        src="https://api.dicebear.com/9.x/shapes/svg?seed=acme-oauth"
        className="size-full object-cover"
      />
    </LogoBox>
  )
}

export default function ConnectInterstitialLogoUploaded() {
  return (
    <InterstitialShell
      logo={<LogoPair left={<UploadedAppLogo />} right={<SupabaseLogo forceLight />} />}
      title="Authorize Acme"
      description="Acme is requesting access to your organization"
    >
      <div className="flex flex-col gap-4">
        <AccountRow displayName="alex@example.com" action={<SignOutButton />} />
        <Button variant="primary" block>
          Authorize Acme
        </Button>
      </div>
    </InterstitialShell>
  )
}
