import { describe, expect, it } from 'bun:test'

import {
  canUsePremiumTheme,
  resolveEntitlements,
  type MembershipSnapshot,
} from '@/lib/billing/entitlements'

const NOW = new Date('2026-05-06T00:00:00.000Z')

function membership(
  status: MembershipSnapshot['status'],
  overrides: Partial<MembershipSnapshot> = {},
): MembershipSnapshot {
  return {
    status,
    trialEndsAt: null,
    currentPeriodEndsAt: null,
    graceEndsAt: null,
    ...overrides,
  }
}

describe('resolveEntitlements', () => {
  it('allows premium theme during trial or active membership', () => {
    expect(resolveEntitlements(membership('trialing'), NOW).premiumTheme).toBe(
      true,
    )
    expect(resolveEntitlements(membership('active'), NOW).premiumTheme).toBe(
      true,
    )
  })

  it('allows past_due only inside the grace period', () => {
    expect(
      resolveEntitlements(
        membership('past_due', { graceEndsAt: '2026-05-07T00:00:00.000Z' }),
        NOW,
      ).premiumTheme,
    ).toBe(true)
    expect(
      resolveEntitlements(
        membership('past_due', { graceEndsAt: '2026-05-05T00:00:00.000Z' }),
        NOW,
      ).premiumTheme,
    ).toBe(false)
  })

  it('does not grant premium theme when membership is absent or ended', () => {
    expect(canUsePremiumTheme(null, NOW)).toBe(false)
    expect(canUsePremiumTheme(membership('free'), NOW)).toBe(false)
    expect(canUsePremiumTheme(membership('ended'), NOW)).toBe(false)
    expect(canUsePremiumTheme(membership('refunded'), NOW)).toBe(false)
  })
})
