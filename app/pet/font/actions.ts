'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'

import { canChangeDiaryFont } from '@/lib/billing/entitlements'
import { getMembershipSnapshot } from '@/lib/billing/server'
import { createClient } from '@/lib/supabase/server'

const SaveDiaryFontSchema = z.object({
  fontKey: z.enum(['buddy_hand', 'line_seed', 'maru_buri']),
})

export type SaveDiaryFontResult =
  | { ok: true }
  | { ok: false; error: string; code?: 'auth' | 'validation' | 'entitlement' | 'db' }

export async function saveDiaryFont(formData: FormData): Promise<SaveDiaryFontResult> {
  const parsed = SaveDiaryFontSchema.safeParse({
    fontKey: formData.get('fontKey'),
  })
  if (!parsed.success) {
    return { ok: false, error: '글꼴을 다시 선택해주세요.', code: 'validation' }
  }

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

  const membership = await getMembershipSnapshot(supabase, user.id)
  if (!canChangeDiaryFont(membership)) {
    return {
      ok: false,
      error: '글꼴 변경은 멤버십에서 사용할 수 있어요.',
      code: 'entitlement',
    }
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

  const { error } = await supabase.from('pet_diary_font_settings').upsert(
    {
      pet_id: pet.id,
      font_key: parsed.data.fontKey,
    },
    { onConflict: 'pet_id' },
  )

  if (error) {
    return {
      ok: false,
      error: '글꼴을 저장하지 못했어요. 잠시 후 다시 시도해주세요.',
      code: 'db',
    }
  }

  revalidatePath('/pet/font')
  revalidatePath('/pet')
  revalidatePath('/')

  return { ok: true }
}
