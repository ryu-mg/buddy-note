import Link from 'next/link'
import { redirect } from 'next/navigation'

import {
  CalendarHome,
  type CalendarDiary,
  type CalendarPet,
} from '@/components/home/calendar-home'
import { createClient } from '@/lib/supabase/server'
import { getSignedPhotoUrl } from '@/lib/storage'

export const dynamic = 'force-dynamic'

type PetSummary = {
  id: string
  name: string
  slug: string
  is_public: boolean
  created_at: string
  personality_code: string | null
  personality_label: string | null
}

type DiaryCalendarRow = {
  id: string
  title: string
  body: string
  image_url_45: string | null
  image_url_11: string | null
  created_at: string
  log: {
    log_date: string
    photo_url: string | null
    photo_storage_path: string | null
  } | null
}

export default async function Home() {
  const supabase = await createClient()

  if (!supabase) {
    return (
      <main className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center gap-3 px-6 text-center">
        <h1 className="text-[22px] font-semibold text-[var(--color-ink)]">
          buddy-note
        </h1>
        <p className="text-[14px] leading-[1.6] text-[var(--color-ink-soft)]">
          Supabase 환경 설정이 필요해요. <code>.env.local</code>에
          <br />
          <code>NEXT_PUBLIC_SUPABASE_URL</code>과
          <code>NEXT_PUBLIC_SUPABASE_ANON_KEY</code>를
          <br />
          채워주시면 시작할 수 있어요.
        </p>
      </main>
    )
  }

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return <AnonymousLanding />
  }

  const { data: pet } = await supabase
    .from('pets')
    .select(
      'id, name, slug, is_public, created_at, personality_code, personality_label',
    )
    .eq('user_id', user.id)
    .limit(1)
    .maybeSingle<PetSummary>()

  if (!pet) {
    redirect('/onboarding')
  }

  const { data: rowsRaw } = await supabase
    .from('diaries')
    .select(
      'id, title, body, image_url_45, image_url_11, created_at, log:logs(log_date, photo_url, photo_storage_path)',
    )
    .eq('pet_id', pet.id)
    .order('created_at', { ascending: false })
    .limit(180)
    .returns<DiaryCalendarRow[]>()

  const rows = rowsRaw ?? []
  const diaries: CalendarDiary[] = await Promise.all(
    rows.map(async (diary): Promise<CalendarDiary> => {
      let imageUrl: string | null =
        diary.image_url_45 ?? diary.image_url_11 ?? diary.log?.photo_url ?? null

      const path = diary.log?.photo_storage_path
      if (path) {
        const signed = await getSignedPhotoUrl(path)
        if ('url' in signed) imageUrl = signed.url
      }

      return {
        id: diary.id,
        title: diary.title,
        body: diary.body,
        imageUrl,
        logDate: diary.log?.log_date ?? diary.created_at.slice(0, 10),
        createdAt: diary.created_at,
      }
    }),
  )

  const calendarPet: CalendarPet = {
    id: pet.id,
    name: pet.name,
    createdAt: pet.created_at,
    personalityCode: pet.personality_code,
    personalityLabel: pet.personality_label,
  }

  return <CalendarHome pet={calendarPet} diaries={diaries} />
}

function AnonymousLanding() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md flex-col items-center justify-center gap-7 px-6 py-12 text-center">
      <div className="flex flex-col gap-3">
        <p className="text-[12px] font-medium uppercase tracking-[0.18em] text-[var(--color-mute)]">
          buddy-note
        </p>
        <h1 className="text-[28px] font-bold leading-[1.25] text-[var(--color-ink)]">
          내 강아지의 성격을
          <br />
          1년 동안 기억해줄게요.
        </h1>
        <p className="mt-1 text-[15px] leading-[1.65] text-[var(--color-ink-soft)]">
          사진 한 장으로 일기가 되고, 일기가 쌓이면
          <br />
          버디가 점점 더 자기 자신 같아져요.
        </p>
      </div>

      <div className="flex flex-col items-center gap-3">
        <Link
          href="/auth/login"
          className="rounded-[10px] bg-[var(--color-accent-brand)] px-6 py-3 text-[15px] font-semibold text-white transition-opacity duration-200 hover:opacity-90"
        >
          카카오로 시작하기
        </Link>
        <p className="text-[12px] text-[var(--color-mute)]">
          MVP에서는 카카오 로그인만 지원해요.
        </p>
      </div>
    </main>
  )
}
