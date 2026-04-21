'use server'

import { redirect } from 'next/navigation'
import { z } from 'zod'
import { stripExifServer } from '@/lib/image/exif-strip-server'
import { createClient } from '@/lib/supabase/server'
import { uploadProfilePhoto } from '@/lib/storage'
import {
  buildPersonaPromptFragment,
  calculatePersonality,
  isCompleteAnswers,
  QUESTION_IDS,
  type Answers,
  type OptionKey,
} from '@/lib/pet-mbti'
import { baseSlug, candidateFor } from '@/lib/slug'

export type SavePetState = {
  error?: string
}

const OptionSchema = z.enum(['A', 'B'])

const InputSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, '이름을 적어주세요.')
    .max(24, '이름은 24자 이내로 적어주세요.'),
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
  profilePhotoDataUrl: z.string().optional().default(''),
  additionalInfo: z.string().trim().max(200, '200자 이내로 적어주세요.').optional().default(''),
  q1: OptionSchema,
  q2: OptionSchema,
  q3: OptionSchema,
  q4: OptionSchema,
})

export async function savePet(
  _prev: SavePetState,
  formData: FormData,
): Promise<SavePetState> {
  const raw = {
    name: formData.get('name'),
    breed: formData.get('breed') ?? '',
    companionRelationship: formData.get('companionRelationship'),
    profilePhotoDataUrl: formData.get('profilePhotoDataUrl') ?? '',
    additionalInfo: formData.get('additionalInfo') ?? '',
    q1: formData.get('q1'),
    q2: formData.get('q2'),
    q3: formData.get('q3'),
    q4: formData.get('q4'),
  }

  const parsed = InputSchema.safeParse(raw)
  if (!parsed.success) {
    const first = parsed.error.issues[0]?.message ?? '입력을 다시 확인해주세요.'
    return { error: first }
  }

  const {
    name,
    breed,
    companionRelationship,
    profilePhotoDataUrl,
    additionalInfo,
  } = parsed.data
  const answers: Answers = {
    q1: parsed.data.q1 as OptionKey,
    q2: parsed.data.q2 as OptionKey,
    q3: parsed.data.q3 as OptionKey,
    q4: parsed.data.q4 as OptionKey,
  }

  if (!isCompleteAnswers(answers)) {
    return { error: '4문항을 모두 선택해주세요.' }
  }

  const supabase = await createClient()
  if (!supabase) {
    return { error: 'Supabase 설정이 필요해요. 관리자에게 문의해주세요.' }
  }

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return { error: '로그인이 필요해요.' }
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

  // Slug 결정 — slug_reserved + pets.slug 중복을 max 50회 시도.
  const base = baseSlug(name)
  let finalSlug: string | null = null
  for (let attempt = 1; attempt <= 50; attempt++) {
    const candidate = candidateFor(base, attempt)

    let reserved = false
    try {
      const { data: r } = await supabase
        .from('slug_reserved')
        .select('slug')
        .eq('slug', candidate)
        .maybeSingle()
      reserved = Boolean(r)
    } catch {
      // slug_reserved 테이블 없는 환경 — 무시.
    }
    if (reserved) continue

    let taken = false
    try {
      const { data: p } = await supabase
        .from('pets')
        .select('id')
        .eq('slug', candidate)
        .maybeSingle()
      taken = Boolean(p)
    } catch {
      // pets 없음 — 일단 후보 채택.
    }
    if (taken) continue

    finalSlug = candidate
    break
  }

  if (!finalSlug) {
    return { error: '이름이 너무 많이 겹쳐요. 다른 이름으로 해볼까요?' }
  }

  const { data: pet, error: insertError } = await supabase
    .from('pets')
    .insert({
      user_id: user.id,
      name,
      species: 'dog',
      breed,
      companion_relationship: companionRelationship,
      additional_info: additionalInfo || null,
      personality_code: personality.code,
      personality_label: personality.label,
      slug: finalSlug,
      persona_answers,
      persona_prompt_fragment,
    })
    .select('id')
    .single<{ id: string }>()

  if (insertError || !pet) {
    return {
      error: '저장 중에 문제가 생겼어요. 잠시 후 다시 시도해주세요.',
    }
  }

  let photoFailed = false
  if (profilePhotoDataUrl.trim()) {
    const decoded = decodeDataUrlImage(profilePhotoDataUrl)
    if (decoded) {
      try {
        const stripped = await stripExifServer(decoded)
        const upload = await uploadProfilePhoto({
          userId: user.id,
          petId: pet.id,
          buffer: stripped,
          contentType: 'image/jpeg',
        })

        if ('path' in upload) {
          const { error: photoUpdateError } = await supabase
            .from('pets')
            .update({ profile_photo_storage_path: upload.path })
            .eq('id', pet.id)
          photoFailed = Boolean(photoUpdateError)
        } else {
          photoFailed = true
        }
      } catch {
        photoFailed = true
      }
    } else {
      photoFailed = true
    }
  }

  if (photoFailed) redirect('/pet?photo=failed')
  redirect('/')
}

function decodeDataUrlImage(dataUrl: string): Buffer | null {
  const match = /^data:image\/(?:jpeg|jpg|png|webp);base64,([A-Za-z0-9+/=]+)$/.exec(
    dataUrl.trim(),
  )
  if (!match?.[1]) return null

  const buffer = Buffer.from(match[1], 'base64')
  if (buffer.length === 0 || buffer.length > 8 * 1024 * 1024) return null
  return buffer
}
