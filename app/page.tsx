import Link from 'next/link'
import { redirect } from 'next/navigation'

import {
  CalendarHome,
  type CalendarDiary,
  type CalendarPet,
} from '@/components/home/calendar-home'
import { BuddyHappy } from '@/components/illustrations/buddy-happy'
import { isDevAuthBypassEnabled } from '@/lib/auth/dev-bypass'
import { createClient } from '@/lib/supabase/server'
import { getSignedPhotoUrl } from '@/lib/storage'
import type { DiaryMood } from '@/types/database'

export const dynamic = 'force-dynamic'

type PetSummary = {
  id: string
  name: string
  created_at: string
  companion_relationship: string | null
  guardian_relationship: string | null
  personality_code: string | null
  personality_label: string | null
}

type DiaryCalendarRow = {
  id: string
  title: string
  body: string
  image_url_45: string | null
  image_url_11: string | null
  mood: DiaryMood | null
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
      'id, name, created_at, companion_relationship, guardian_relationship, personality_code, personality_label',
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
      'id, title, body, image_url_45, image_url_11, mood, created_at, log:logs(log_date, photo_url, photo_storage_path)',
    )
    .eq('pet_id', pet.id)
    .order('created_at', { ascending: false })
    .limit(180)
    .returns<DiaryCalendarRow[]>()

  const diaries: CalendarDiary[] = await Promise.all(
    (rowsRaw ?? []).map(async (diary): Promise<CalendarDiary> => {
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
        mood: diary.mood,
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
    companionRelationship:
      pet.companion_relationship ?? pet.guardian_relationship ?? null,
  }

  return <CalendarHome pet={calendarPet} diaries={diaries} />
}

function AnonymousLanding() {
  const devBypassEnabled = isDevAuthBypassEnabled()

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md flex-col items-center justify-center gap-7 px-6 py-12 text-center">
      <BuddyHappy className="h-32 w-44" />
      <div className="flex flex-col gap-3">
        <p className="text-[12px] font-medium uppercase tracking-[0.18em] text-[var(--color-mute)]">
          buddy-note
        </p>
        <h1 className="font-serif text-[34px] font-semibold leading-[1.15] text-[var(--color-ink)]">
          내 강아지가
          <br />
          직접 남기는 하루
        </h1>
        <p className="mt-1 text-[15px] leading-[1.65] text-[var(--color-ink-soft)]">
          사진 한 장이 버디노트가 되고, 쌓인 기록은 버디의 성격으로 남아요.
        </p>
      </div>

      <div className="flex w-full max-w-[310px] flex-col gap-3">
        <Link
          href="/auth/login"
          className="rounded-[var(--radius-button)] bg-[var(--color-accent-cta)] px-6 py-3 text-[15px] font-semibold text-[var(--primary-foreground)] shadow-[var(--shadow-accent)] transition-opacity duration-200 hover:opacity-90"
        >
          카카오로 시작하기
        </Link>
        {devBypassEnabled ? (
          <Link
            href="/auth/dev"
            className="rounded-[var(--radius-button)] border border-[var(--color-line)] bg-[var(--color-bg)] px-6 py-3 text-[15px] font-semibold text-[var(--color-ink-soft)] transition-colors duration-200 hover:bg-[var(--color-paper)]"
          >
            로컬 개발 로그인
          </Link>
        ) : null}
      </div>
    </main>
  )
}
