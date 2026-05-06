import 'server-only'

import type { SupabaseClient } from '@supabase/supabase-js'

import type { MembershipSnapshot, MembershipStatus } from '@/lib/billing/entitlements'

type MembershipRow = {
  status: MembershipStatus
  trial_ends_at: string | null
  current_period_ends_at: string | null
  grace_ends_at: string | null
}

export async function getMembershipSnapshot(
  supabase: SupabaseClient,
  userId: string,
): Promise<MembershipSnapshot | null> {
  const { data } = await supabase
    .from('memberships')
    .select('status, trial_ends_at, current_period_ends_at, grace_ends_at')
    .eq('user_id', userId)
    .maybeSingle<MembershipRow>()

  if (!data) return null

  return {
    status: data.status,
    trialEndsAt: data.trial_ends_at,
    currentPeriodEndsAt: data.current_period_ends_at,
    graceEndsAt: data.grace_ends_at,
  }
}
