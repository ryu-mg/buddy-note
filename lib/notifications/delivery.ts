import 'server-only'

import type { SupabaseClient } from '@supabase/supabase-js'

import {
  notificationPreferencesFromRow,
  shouldDeliverNotification,
} from '@/lib/notifications/preferences'
import type {
  NotificationInsert,
  NotificationKind,
  NotificationPreferenceRow,
} from '@/types/database'

type UntypedSupabase = SupabaseClient

type NotificationPayload = {
  userId: string
  kind: NotificationKind
  title: string
  body: string
  href?: string | null
}

export async function createNotificationIfAllowed(
  adminDb: UntypedSupabase,
  payload: NotificationPayload,
): Promise<{ delivered: boolean }> {
  const { data: preferenceRow } = await adminDb
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
    .eq('user_id', payload.userId)
    .maybeSingle<NotificationPreferenceRow>()

  const preferences = notificationPreferencesFromRow(preferenceRow)
  if (!shouldDeliverNotification(preferences, payload.kind)) {
    return { delivered: false }
  }

  const notification: NotificationInsert = {
    user_id: payload.userId,
    kind: payload.kind,
    title: payload.title,
    body: payload.body,
    href: payload.href ?? null,
  }

  await adminDb.from('notifications').insert(notification)
  return { delivered: true }
}
