import { redirect } from 'next/navigation'

import { DiaryFontPicker } from '@/components/diary-fonts/font-picker'
import { canChangeDiaryFont } from '@/lib/billing/entitlements'
import { getMembershipSnapshot } from '@/lib/billing/server'
import { getPetDiaryFontKey } from '@/lib/diary-fonts/server'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

type PetFontPagePet = {
  id: string
  name: string
}

export default async function PetFontPage() {
  const supabase = await createClient()
  if (!supabase) redirect('/auth/login')

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: pet } = await supabase
    .from('pets')
    .select('id, name')
    .eq('user_id', user.id)
    .limit(1)
    .maybeSingle<PetFontPagePet>()

  if (!pet) redirect('/onboarding')

  const [fontKey, membership] = await Promise.all([
    getPetDiaryFontKey(supabase, pet.id),
    getMembershipSnapshot(supabase, user.id),
  ])

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md flex-col gap-6 px-4 pb-24 pt-8">
      <header className="flex flex-col gap-1">
        <h1 className="text-[24px] font-semibold leading-[1.25] text-[var(--color-ink)]">
          {pet.name}의 일기 글꼴
        </h1>
        <p className="text-[13px] leading-[1.55] text-[var(--color-mute)]">
          강아지가 말을 건네는 느낌에 맞춰 일기 본문 글꼴을 고를 수 있어요.
        </p>
      </header>

      <DiaryFontPicker
        initialFontKey={fontKey}
        canSave={canChangeDiaryFont(membership)}
        petName={pet.name}
      />
    </main>
  )
}
