import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export default async function OnboardingEntryPage() {
  const supabase = await createClient()

  if (!supabase) {
    // Supabase env 미설정. 로그인 페이지가 안내 문구를 보여줌.
    redirect('/auth/login')
  }

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/login')
  }

  // 이미 pet 이 있으면 홈으로.
  try {
    const { data: existing } = await supabase
      .from('pets')
      .select('id')
      .eq('user_id', user.id)
      .limit(1)
      .maybeSingle()

    if (existing) {
      redirect('/')
    }
  } catch {
    // pets 테이블 아직 없을 수도 있음 — 온보딩 시작은 허용.
  }

  redirect('/onboarding/steps/0')
}
