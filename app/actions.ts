'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'

import { createClient } from '@/lib/supabase/server'

export type TogglePublicResult =
  | { ok: true; is_public: boolean }
  | { ok: false; error: string }

const PetIdSchema = z.string().uuid('잘못된 요청이에요.')

/**
 * 강아지 프로필 공개/비공개 토글.
 * - auth check
 * - pet 소유권 확인 (RLS 도 막지만 explicit guard)
 * - is_public 반전
 * - 홈 + /b/[slug] 캐시 무효화
 *
 * Server Action 컨벤션: throw 대신 return.
 */
export async function togglePublic(petId: string): Promise<TogglePublicResult> {
  const parsed = PetIdSchema.safeParse(petId)
  if (!parsed.success) {
    return { ok: false, error: '잘못된 요청이에요.' }
  }

  const supabase = await createClient()
  if (!supabase) {
    return { ok: false, error: 'Supabase 설정이 필요해요.' }
  }

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return { ok: false, error: '로그인이 필요해요.' }
  }

  const { data: pet, error: fetchError } = await supabase
    .from('pets')
    .select('id, slug, is_public, user_id')
    .eq('id', parsed.data)
    .maybeSingle()

  if (fetchError || !pet) {
    return { ok: false, error: '강아지를 찾지 못했어요.' }
  }
  if (pet.user_id !== user.id) {
    return { ok: false, error: '이 강아지의 공개 여부는 바꿀 수 없어요.' }
  }

  const next = !pet.is_public

  const { error: updateError } = await supabase
    .from('pets')
    .update({ is_public: next })
    .eq('id', pet.id)

  if (updateError) {
    return {
      ok: false,
      error: '공개 설정을 바꾸는 중에 문제가 생겼어요. 잠시 후 다시 해주세요.',
    }
  }

  // 홈은 dynamic 이지만 명시. 공개 프로필 페이지는 ISR 가능성 → 무효화.
  try {
    revalidatePath('/')
    revalidatePath(`/b/${pet.slug}`)
  } catch {
    // revalidatePath 실패는 critical 아님.
  }

  return { ok: true, is_public: next }
}
