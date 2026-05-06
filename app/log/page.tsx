import { redirect } from 'next/navigation'

import { createClient } from '@/lib/supabase/server'

import { UploadForm } from './upload-form'

export const dynamic = 'force-dynamic'

/**
 * /log — 사진 업로드 + 일기 생성 진입 페이지.
 *
 * Auth gate:
 *   - 비로그인 → /auth/login
 *   - pet 없음 → /onboarding
 *   - pet 있음 → 폴라로이드 스타일 업로드 폼
 *
 * 데이터 로드는 RSC에서만 수행하고, 인터랙션은 `UploadForm` (client)에서.
 */
export default async function LogPage() {
  const supabase = await createClient()
  if (!supabase) {
    redirect('/auth/login')
  }

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    redirect('/auth/login')
  }

  const { data: pet } = await supabase
    .from('pets')
    .select('id, name, persona_prompt_fragment, companion_relationship, guardian_relationship')
    .eq('user_id', user.id)
    .limit(1)
    .maybeSingle()

  if (!pet) {
    redirect('/onboarding')
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md flex-col gap-6 px-4 pb-[calc(var(--bottom-nav-height)+var(--bottom-nav-offset-gap))] pt-10">
      <header className="flex flex-col gap-1">
        <p
          className="text-[12px] tracking-[0.08em] text-[var(--color-mute)] uppercase"
          style={{ fontFamily: 'var(--font-sans)' }}
        >
          오늘의 한 장
        </p>
        <h1
          className="text-[22px] leading-[1.3] font-medium text-[var(--color-ink)]"
          style={{ fontFamily: 'var(--font-sans)' }}
        >
          {pet.name}의 오늘을 남겨볼까요
        </h1>
        <p
          className="mt-1 text-[14px] leading-[1.55] text-[var(--color-ink-soft)]"
          style={{ fontFamily: 'var(--font-sans)' }}
        >
          사진 한 장만 올려주면 {pet.name}의 말투로 일기를 적어줄게요.
        </p>
      </header>

      <UploadForm
        petId={pet.id}
        petName={pet.name}
        companionRelationship={
          pet.companion_relationship ?? pet.guardian_relationship ?? null
        }
      />
    </main>
  )
}
