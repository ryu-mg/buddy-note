'use server'

import { revalidatePath } from 'next/cache'

import {
  notificationPreferencesToRow,
  parseNotificationPreferencesForm,
} from '@/lib/notifications/preferences'
import { createClient } from '@/lib/supabase/server'

export type SaveNotificationPreferencesResult =
  | { ok: true }
  | { ok: false; error: string; code?: 'auth' | 'db' | 'validation' }

export async function saveNotificationPreferences(
  _previousState: SaveNotificationPreferencesResult | undefined,
  formData: FormData,
): Promise<SaveNotificationPreferencesResult> {
  const supabase = await createClient()
  if (!supabase) {
    return {
      ok: false,
      error: 'Supabase 설정이 필요해요. 관리자에게 문의해주세요.',
      code: 'db',
    }
  }

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return { ok: false, error: '로그인이 필요해요.', code: 'auth' }
  }

  const parsed = parseNotificationPreferencesForm(formData)
  if (!parsed.ok) {
    return { ok: false, error: parsed.error, code: 'validation' }
  }

  const { error } = await supabase.from('notification_preferences').upsert(
    notificationPreferencesToRow(user.id, parsed.preferences),
    { onConflict: 'user_id' },
  )

  if (error) {
    return {
      ok: false,
      error: '알림 설정을 저장하지 못했어요. 잠시 후 다시 시도해주세요.',
      code: 'db',
    }
  }

  revalidatePath('/more')
  revalidatePath('/more/notifications')
  return { ok: true }
}
