import type { MembershipStatus } from '@/types/database'

export const MEMBERSHIP_PAYMENT_GRACE_DAYS = 7

export type RenewableMembershipSnapshot = {
  status: MembershipStatus
  currentPeriodEndsAt: string | null
  cancelAtPeriodEnd: boolean
  providerCustomerKey: string | null
  providerBillingKey: string | null
}

export function addMonths(date: Date, months: number): Date {
  const next = new Date(date)
  const day = next.getDate()

  next.setDate(1)
  next.setMonth(next.getMonth() + months)

  const lastDayOfTargetMonth = new Date(
    next.getFullYear(),
    next.getMonth() + 1,
    0,
  ).getDate()

  next.setDate(Math.min(day, lastDayOfTargetMonth))
  return next
}

export function buildGraceEndsAt(
  now: Date,
  days = MEMBERSHIP_PAYMENT_GRACE_DAYS,
): Date {
  const endsAt = new Date(now)
  endsAt.setDate(endsAt.getDate() + days)
  return endsAt
}

export function resolveRenewalPeriod(
  previousPeriodEnd: string | null,
  now: Date,
): { startsAt: Date; endsAt: Date } {
  const startsAt =
    previousPeriodEnd && new Date(previousPeriodEnd) > now
      ? new Date(previousPeriodEnd)
      : new Date(now)

  return {
    startsAt,
    endsAt: addMonths(startsAt, 1),
  }
}

export function shouldRenewMembership(
  membership: RenewableMembershipSnapshot,
  now: Date,
): boolean {
  if (membership.cancelAtPeriodEnd) return false
  if (!membership.providerCustomerKey || !membership.providerBillingKey) {
    return false
  }
  if (!['active', 'past_due'].includes(membership.status)) return false
  if (!membership.currentPeriodEndsAt) return false

  return new Date(membership.currentPeriodEndsAt) <= now
}
