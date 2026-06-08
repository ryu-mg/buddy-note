import { describe, expect, it } from 'bun:test'

import {
  addMonths,
  buildGraceEndsAt,
  resolveRenewalPeriod,
  shouldRenewMembership,
  type RenewableMembershipSnapshot,
} from '@/lib/billing/renewal'

const NOW = new Date('2026-06-07T00:00:00.000Z')

function membership(
  overrides: Partial<RenewableMembershipSnapshot> = {},
): RenewableMembershipSnapshot {
  return {
    status: 'active',
    currentPeriodEndsAt: '2026-06-06T00:00:00.000Z',
    cancelAtPeriodEnd: false,
    providerCustomerKey: 'customer_user_1',
    providerBillingKey: 'billing_key_1',
    ...overrides,
  }
}

describe('membership renewal helpers', () => {
  it('adds one month without overflowing short months', () => {
    expect(addMonths(new Date('2026-01-31T00:00:00.000Z'), 1).toISOString()).toBe(
      '2026-02-28T00:00:00.000Z',
    )
  })

  it('builds a seven day grace period by default', () => {
    expect(buildGraceEndsAt(NOW).toISOString()).toBe(
      '2026-06-14T00:00:00.000Z',
    )
  })

  it('renews active or past_due memberships with due billing keys', () => {
    expect(shouldRenewMembership(membership(), NOW)).toBe(true)
    expect(shouldRenewMembership(membership({ status: 'past_due' }), NOW)).toBe(
      true,
    )
  })

  it('does not renew canceled, future, or incomplete billing memberships', () => {
    expect(
      shouldRenewMembership(membership({ cancelAtPeriodEnd: true }), NOW),
    ).toBe(false)
    expect(
      shouldRenewMembership(
        membership({ currentPeriodEndsAt: '2026-06-08T00:00:00.000Z' }),
        NOW,
      ),
    ).toBe(false)
    expect(
      shouldRenewMembership(membership({ providerBillingKey: null }), NOW),
    ).toBe(false)
    expect(shouldRenewMembership(membership({ status: 'ended' }), NOW)).toBe(
      false,
    )
  })

  it('starts the next period from now when the previous period already ended', () => {
    const period = resolveRenewalPeriod('2026-06-01T00:00:00.000Z', NOW)

    expect(period.startsAt.toISOString()).toBe('2026-06-07T00:00:00.000Z')
    expect(period.endsAt.toISOString()).toBe('2026-07-07T00:00:00.000Z')
  })
})
