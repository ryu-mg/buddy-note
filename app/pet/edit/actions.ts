'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'

import { createLogger } from '@/lib/logger'
import {
  buildPersonaPromptFragment,
  calculatePersonality,
  isCompleteAnswers,
  QUESTION_IDS,
  type Answers,
  type OptionKey,
} from '@/lib/pet-mbti'
import { createClient } from '@/lib/supabase/server'

const log = createLogger('pet:edit')

export type UpdatePetResult =
  | { ok: true }
  | { ok: false; error: string; code?: 'auth' | 'validation' | 'db' }

const OptionSchema = z.enum(['A', 'B'])

const InputSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, '이름을 적어주세요.')
    .max(40, '이름은 40자 이내로 적어주세요.'),
  breed: z
    .string()
    .trim()
    .min(1, '견종을 적어주세요.')
    .max(40, '견종은 40자 이내로 적어주세요.'),
  companionRelationship: z
    .string()
    .trim()
    .min(1, '반려인 호칭을 적어주세요.')
    .max(20, '반려인 호칭은 20자 이내로 적어주세요.'),
  additionalInfo: z.string().trim().max(200, '200자 이내로 적어주세요.').optional().default(''),
  q1: OptionSchema,
  q2: OptionSchema,
  q3: OptionSchema,
  q4: OptionSchema,
})

/**
 * 프로필 업데이트.
 *
 * SLUG 정책 (locked 결정):
 *   slug 는 **재생성하지 않는다**. 공개 URL `/b/[slug]` 은 외부 SNS 에
 *   이미 퍼져있을 수 있는 "영구 식별자" 이고, 이름을 바꿨다고 슬러그가
 *   바뀌면 기존 공유 링크가 죽는다 (D7, architecture.md §5 "PUBLIC 상태
 *   유지" 논리와 동일). 슬러그 개명이 필요하면 별도 명시적 UX 로 풀 것.
 *
 * persona_prompt_fragment 는 새 이름/견종/답변으로 **매 저장 시 재생성**.
 * 이 프래그먼트는 LLM 프롬프트에 주입되는 부분이라 이름 바꾸면 자연스레
 * 다음 일기부터 새 이름으로 말한다.
 */
export async function updatePet(
  formData: FormData,
): Promise<UpdatePetResult> {
  const raw = {
    name: formData.get('name'),
    breed: formData.get('breed') ?? '',
    companionRelationship: formData.get('companionRelationship'),
    additionalInfo: formData.get('additionalInfo') ?? '',
    q1: formData.get('q1'),
    q2: formData.get('q2'),
    q3: formData.get('q3'),
    q4: formData.get('q4'),
  }

  const parsed = InputSchema.safeParse(raw)
  if (!parsed.success) {
    const first = parsed.error.issues[0]?.message ?? '입력을 다시 확인해주세요.'
    return { ok: false, error: first, code: 'validation' }
  }

  const { name, breed, companionRelationship, additionalInfo } = parsed.data
  const answers: Answers = {
    q1: parsed.data.q1 as OptionKey,
    q2: parsed.data.q2 as OptionKey,
    q3: parsed.data.q3 as OptionKey,
    q4: parsed.data.q4 as OptionKey,
  }
  if (!isCompleteAnswers(answers)) {
    return {
      ok: false,
      error: '4문항을 모두 골라주세요.',
      code: 'validation',
    }
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

  // 소유권 확인 (RLS 도 막지만 explicit guard — slug 취득 겸함).
  const { data: pet, error: fetchError } = await supabase
    .from('pets')
    .select('id, slug, user_id')
    .eq('user_id', user.id)
    .limit(1)
    .maybeSingle<{ id: string; slug: string; user_id: string }>()

  if (fetchError || !pet) {
    return { ok: false, error: '프로필을 찾지 못했어요.', code: 'db' }
  }
  if (pet.user_id !== user.id) {
    return { ok: false, error: '이 프로필은 수정할 수 없어요.', code: 'auth' }
  }

  const persona_prompt_fragment = buildPersonaPromptFragment({
    name,
    breed,
    companionRelationship,
    answers,
    additionalInfo,
  })
  const personality = calculatePersonality(answers)

  const persona_answers: Record<string, OptionKey> = {}
  for (const id of QUESTION_IDS) persona_answers[id] = answers[id]

  const { error: updateError } = await supabase
    .from('pets')
    .update({
      name,
      breed,
      companion_relationship: companionRelationship,
      additional_info: additionalInfo || null,
      personality_code: personality.code,
      personality_label: personality.label,
      persona_answers,
      persona_prompt_fragment,
    })
    .eq('id', pet.id)

  if (updateError) {
    log.error('update failed', { err: updateError })
    return {
      ok: false,
      error: '저장 중에 문제가 생겼어요. 잠시 후 다시 시도해주세요.',
      code: 'db',
    }
  }

  try {
    revalidatePath('/pet')
    revalidatePath('/')
    revalidatePath(`/b/${pet.slug}`)
  } catch {
    // revalidatePath 실패는 critical 아님.
  }

  return { ok: true }
}
