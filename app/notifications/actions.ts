'use server'

import { revalidatePath } from 'next/cache'
import type { SupabaseClient } from '@supabase/supabase-js'

import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'

type UntypedSupabase = SupabaseClient

export type MarkNotificationsReadResult =
  | { ok: true }
  | { ok: false; error: string; code?: 'auth' | 'db' }

export async function markAllNotificationsRead(): Promise<MarkNotificationsReadResult> {
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

  const admin = createAdminClient()
  if (!admin) {
    return {
      ok: false,
      error: 'Supabase service role 설정이 필요해요.',
      code: 'db',
    }
  }
  const adminDb = admin as unknown as UntypedSupabase

  const { error } = await adminDb
    .from('notifications')
    .update({ read_at: new Date().toISOString() })
    .eq('user_id', user.id)
    .is('read_at', null)

  if (error) {
    return {
      ok: false,
      error: '알림을 읽음 처리하지 못했어요. 잠시 후 다시 시도해주세요.',
      code: 'db',
    }
  }

  revalidatePath('/notifications')
  revalidatePath('/')
  return { ok: true }
}
