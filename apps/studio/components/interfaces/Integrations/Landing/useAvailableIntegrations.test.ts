import type { FeatureFlagContextType } from 'common'
import { describe, expect, it } from 'vitest'

import { INTEGRATION_FLAGS } from './Integrations.constants'
import { isPreviewEnabled } from './useAvailableIntegrations'

const makeFlags = (configcat: Record<string, unknown>): FeatureFlagContextType =>
  ({ configcat, posthog: {} }) as unknown as FeatureFlagContextType

describe('isPreviewEnabled', () => {
  it('is false when the listing flag is off', () => {
    expect(
      isPreviewEnabled(makeFlags({ grafanaDashboardIntegrationEnabled: false }), 'grafana')
    ).toBe(false)
  })

  it('is true when the listing flag is on', () => {
    expect(
      isPreviewEnabled(makeFlags({ grafanaDashboardIntegrationEnabled: true }), 'grafana')
    ).toBe(true)
  })

  it('defaults to false when the flag is absent from the store', () => {
    // e.g. flags not loaded yet, or no ConfigCat flag for this listing
    expect(isPreviewEnabled(makeFlags({}), 'resend')).toBe(false)
  })

  it('gates each flagged integration independently', () => {
    const flags = makeFlags({
      grafanaDashboardIntegrationEnabled: true,
      resendDashboardIntegrationEnabled: false,
      aikidoDashboardIntegrationEnabled: true,
      dopplerDashboardIntegrationEnabled: false,
    })
    expect(isPreviewEnabled(flags, 'grafana')).toBe(true)
    expect(isPreviewEnabled(flags, 'resend')).toBe(false)
    expect(isPreviewEnabled(flags, 'aikido')).toBe(true)
    expect(isPreviewEnabled(flags, 'doppler')).toBe(false)
  })
})

describe('INTEGRATION_FLAGS (the flag-gated set)', () => {
  it('maps each gated integration id to its <id>DashboardIntegrationEnabled flag', () => {
    expect(INTEGRATION_FLAGS).toEqual({
      grafana: 'grafanaDashboardIntegrationEnabled',
      resend: 'resendDashboardIntegrationEnabled',
      aikido: 'aikidoDashboardIntegrationEnabled',
      doppler: 'dopplerDashboardIntegrationEnabled',
    })
  })

  it('does not gate integrations outside the set (they are always visible)', () => {
    // The dataWithMarketplace filter is `!INTEGRATION_FLAGS[id] || isPreviewEnabled(...)`,
    // so anything absent here (cron, queues, wrappers, ...) is never hidden by a flag.
    expect(INTEGRATION_FLAGS['cron']).toBeUndefined()
    expect(INTEGRATION_FLAGS['queues']).toBeUndefined()
    expect(INTEGRATION_FLAGS['stripe_sync_engine']).toBeUndefined()
  })
})
