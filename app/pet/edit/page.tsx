import { redirect } from 'next/navigation'

import { createClient } from '@/lib/supabase/server'
import { PetEditForm } from '@/components/pet/pet-edit-form'
import type { PersonaAnswers } from '@/types/database'

export const dynamic = 'force-dynamic'

type PetForEdit = {
  id: string
  name: string
  breed: string | null
  guardian_relationship: string | null
  companion_relationship: string | null
  additional_info: string | null
  persona_answers: PersonaAnswers | null
}

/**
 * /pet/edit — 프로필 수정 컨테이너 (Server Component).
 *
 * auth + pet 게이트 후 client `PetEditForm` 에 현재값을 prefill.
 * 실제 업데이트는 `./actions.ts#updatePet`.
 */
export default async function PetEditPage() {
  const supabase = await createClient()
  if (!supabase) redirect('/auth/login')

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: pet } = await supabase
    .from('pets')
    .select(
      'id, name, breed, guardian_relationship, companion_relationship, additional_info, persona_answers',
    )
    .eq('user_id', user.id)
    .limit(1)
    .maybeSingle<PetForEdit>()

  if (!pet) redirect('/onboarding')

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-2xl flex-col gap-6 px-4 pb-20 pt-8 sm:px-6 md:pt-10">
      <header className="flex flex-col gap-1">
        <p className="text-[12px] font-medium uppercase tracking-[0.14em] text-[var(--color-mute)]">
          프로필 수정
        </p>
        <h1 className="text-[24px] font-semibold leading-[1.25] text-[var(--color-ink)]">
          {pet.name}의 정보를 다듬을게요
        </h1>
        <p className="text-[13px] leading-[1.5] text-[var(--color-mute)]">
          바꾼 내용은 다음 일기부터 반영돼요.
        </p>
      </header>

      <PetEditForm
        pet={{
          id: pet.id,
          name: pet.name,
          breed: pet.breed ?? '',
          companionRelationship:
            pet.companion_relationship ?? pet.guardian_relationship ?? '',
          additionalInfo: pet.additional_info ?? '',
          persona_answers: pet.persona_answers ?? {},
        }}
      />
    </main>
  )
}
