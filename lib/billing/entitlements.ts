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
  diaryRewrite: boolean
  fontChange: boolean
  premiumTheme: boolean
  themeChange: boolean
}

const NO_ENTITLEMENTS: Entitlements = {
  diaryRewrite: false,
  fontChange: false,
  premiumTheme: false,
  themeChange: false,
}

const MEMBERSHIP_ENTITLEMENTS: Entitlements = {
  diaryRewrite: true,
  fontChange: true,
  premiumTheme: true,
  themeChange: true,
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
  if (!membership) return NO_ENTITLEMENTS

  if (membership.status === 'trialing') {
    return MEMBERSHIP_ENTITLEMENTS
  }

  if (membership.status === 'active' || membership.status === 'canceling') {
    return MEMBERSHIP_ENTITLEMENTS
  }

  if (membership.status === 'past_due') {
    return isAfterNow(membership.graceEndsAt, now)
      ? MEMBERSHIP_ENTITLEMENTS
      : NO_ENTITLEMENTS
  }

  return NO_ENTITLEMENTS
}

export function canUsePremiumTheme(
  membership: MembershipSnapshot | null,
  now = new Date(),
): boolean {
  return resolveEntitlements(membership, now).premiumTheme
}

export function canRewriteDiary(
  membership: MembershipSnapshot | null,
  now = new Date(),
): boolean {
  return resolveEntitlements(membership, now).diaryRewrite
}

export function canChangeDiaryFont(
  membership: MembershipSnapshot | null,
  now = new Date(),
): boolean {
  return resolveEntitlements(membership, now).fontChange
}
