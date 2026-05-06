export type MembershipStatus =
  | 'free'
  | 'trialing'
  | 'active'
  | 'past_due'
  | 'canceling'
  | 'ended'
  | 'refunded'

export type MembershipSnapshot = {
  status: MembershipStatus
  trialEndsAt: string | null
  currentPeriodEndsAt: string | null
  graceEndsAt: string | null
}

export type Entitlements = {
  premiumTheme: boolean
}

function isAfterNow(value: string | null, now: Date): boolean {
  if (!value) return false
  const time = new Date(value).getTime()
  if (Number.isNaN(time)) return false
  return time > now.getTime()
}

export function resolveEntitlements(
  membership: MembershipSnapshot | null,
  now = new Date(),
): Entitlements {
  if (!membership) return { premiumTheme: false }

  if (membership.status === 'trialing') {
    return { premiumTheme: true }
  }

  if (membership.status === 'active' || membership.status === 'canceling') {
    return { premiumTheme: true }
  }

  if (membership.status === 'past_due') {
    return { premiumTheme: isAfterNow(membership.graceEndsAt, now) }
  }

  return { premiumTheme: false }
}

export function canUsePremiumTheme(
  membership: MembershipSnapshot | null,
  now = new Date(),
): boolean {
  return resolveEntitlements(membership, now).premiumTheme
}
