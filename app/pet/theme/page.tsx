import { redirect } from 'next/navigation'

import { ThemePicker } from '@/components/themes/theme-picker'
import { canUsePremiumTheme } from '@/lib/billing/entitlements'
import { getMembershipSnapshot } from '@/lib/billing/server'
import { createClient } from '@/lib/supabase/server'
import { getPetThemeKey } from '@/lib/themes/server'

export const dynamic = 'force-dynamic'

type PetThemePagePet = {
  id: string
  name: string
}

export default async function PetThemePage() {
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
    .maybeSingle<PetThemePagePet>()

  if (!pet) redirect('/onboarding')

  const [themeKey, membership] = await Promise.all([
    getPetThemeKey(supabase, pet.id),
    getMembershipSnapshot(supabase, user.id),
  ])
  const canSave = canUsePremiumTheme(membership)

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md flex-col gap-6 px-4 pb-24 pt-8">
      <header className="flex flex-col gap-1">
        <p className="text-[12px] font-medium uppercase tracking-[0.14em] text-[var(--color-mute)]">
          theme
        </p>
        <h1 className="text-[24px] font-semibold leading-[1.25] text-[var(--color-ink)]">
          {pet.name}의 앨범 색을 고를게요
        </h1>
        <p className="text-[13px] leading-[1.55] text-[var(--color-mute)]">
          저장한 테마는 홈과 새 공유 이미지에 반영돼요.
        </p>
      </header>

      <ThemePicker initialThemeKey={themeKey} canSave={canSave} />
    </main>
  )
}
