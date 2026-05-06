'use server'

import { revalidatePath } from 'next/cache'

import { canUsePremiumTheme } from '@/lib/billing/entitlements'
import { getMembershipSnapshot } from '@/lib/billing/server'
import { createClient } from '@/lib/supabase/server'
import { validateThemeKey } from '@/lib/themes/validation'

export type SaveThemeResult =
  | { ok: true }
  | { ok: false; error: string; code?: 'auth' | 'validation' | 'entitlement' | 'db' }

export async function savePetTheme(formData: FormData): Promise<SaveThemeResult> {
  const parsed = validateThemeKey(formData.get('themeKey'))
  if (!parsed.ok) {
    return { ok: false, error: parsed.error, code: 'validation' }
  }

  const supabase = await createClient()
  if (!supabase) {
    return {
      ok: false,
      error: 'Supabase 설정이 필요해요. 관리자에게 문의해주세요.',
      code: 'auth',
    }
  }

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return { ok: false, error: '로그인이 필요해요.', code: 'auth' }
  }

  const { data: pet } = await supabase
    .from('pets')
    .select('id')
    .eq('user_id', user.id)
    .limit(1)
    .maybeSingle<{ id: string }>()

  if (!pet) {
    return { ok: false, error: '강아지 정보를 찾지 못했어요.', code: 'db' }
  }

  const membership = await getMembershipSnapshot(supabase, user.id)
  if (!canUsePremiumTheme(membership)) {
    return {
      ok: false,
      error: '테마 저장은 멤버십에서 사용할 수 있어요. 먼저 체험 또는 멤버십을 열어주세요.',
      code: 'entitlement',
    }
  }

  const { error } = await supabase.from('pet_theme_settings').upsert(
    {
      pet_id: pet.id,
      theme_key: parsed.themeKey,
    },
    { onConflict: 'pet_id' },
  )

  if (error) {
    return {
      ok: false,
      error: '테마를 저장하지 못했어요. 잠시 후 다시 시도해주세요.',
      code: 'db',
    }
  }

  revalidatePath('/pet/theme')
  revalidatePath('/pet')
  revalidatePath('/')

  return { ok: true }
}
