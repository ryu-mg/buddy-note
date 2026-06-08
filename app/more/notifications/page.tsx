import { redirect } from 'next/navigation'

import { BackLink } from '@/components/layout/back-link'
import { notificationPreferencesFromRow } from '@/lib/notifications/preferences'
import { createClient } from '@/lib/supabase/server'
import type { NotificationPreferenceRow } from '@/types/database'

import { NotificationSettingsForm } from './settings-form'

export const dynamic = 'force-dynamic'

export default async function NotificationSettingsPage() {
  const supabase = await createClient()
  if (!supabase) redirect('/auth/login')

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: row } = await supabase
    .from('notification_preferences')
    .select(
      [
        'user_id',
        'all_notifications_enabled',
        'diary_reminder_enabled',
        'diary_complete_enabled',
        'notice_enabled',
        'membership_enabled',
        'support_enabled',
        'reminder_time',
        'created_at',
        'updated_at',
      ].join(', '),
    )
    .eq('user_id', user.id)
    .maybeSingle<NotificationPreferenceRow>()

  const preferences = notificationPreferencesFromRow(row)

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md flex-col gap-6 px-4 pb-28 pt-6">
      <BackLink href="/more" label="더보기로 돌아가기" />

      <NotificationSettingsForm initialPreferences={preferences} />
    </main>
  )
}
