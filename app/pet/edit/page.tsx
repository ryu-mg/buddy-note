import { redirect } from 'next/navigation'

import { createClient } from '@/lib/supabase/server'
import { PublicToggle } from '@/components/home/public-toggle'
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
  slug: string
  is_public: boolean
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
      'id, name, breed, guardian_relationship, companion_relationship, additional_info, slug, is_public, persona_answers',
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

      <section
        id="public"
        aria-labelledby="edit-public-title"
        className="flex flex-col gap-4 rounded-[var(--radius-card)] border border-[var(--color-line)] bg-[var(--color-bg)] px-5 py-5"
      >
        <div className="flex flex-col gap-0.5">
          <h2
            id="edit-public-title"
            className="text-[15px] font-semibold text-[var(--color-ink)]"
          >
            공개 프로필 설정
          </h2>
          <p className="text-[12px] text-[var(--color-mute)]">
            공개로 바꾸면 /b/{pet.slug} 주소를 공유할 수 있어요.
          </p>
        </div>
        <PublicToggle
          petId={pet.id}
          initialPublic={pet.is_public}
          slug={pet.slug}
        />
      </section>
    </main>
  )
}
