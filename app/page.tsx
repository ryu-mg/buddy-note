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
import { FIRST_ENTRY_TUTORIAL_VERSION } from '@/lib/tutorial/first-entry-tutorial'
import { shouldShowFirstEntryTutorial } from '@/lib/tutorial/visibility'
import { getPetThemeKey } from '@/lib/themes/server'
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
  image_url_916: string | null
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

type TutorialStateRow = {
  completed_at: string | null
  dismissed_at: string | null
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

  const { data: tutorialState } = await supabase
    .from('user_tutorial_state')
    .select('completed_at, dismissed_at')
    .eq('user_id', user.id)
    .eq('tutorial_version', FIRST_ENTRY_TUTORIAL_VERSION)
    .maybeSingle<TutorialStateRow>()

  const themeKey = await getPetThemeKey(supabase, pet.id)

  const { data: rowsRaw } = await supabase
    .from('diaries')
    .select(
      'id, title, body, image_url_916, image_url_45, image_url_11, mood, created_at, log:logs(log_date, photo_url, photo_storage_path)',
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
        shareImages: {
          '9:16': diary.image_url_916,
          '4:5': diary.image_url_45,
          '1:1': diary.image_url_11,
        },
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

  const showFirstEntryTutorial = shouldShowFirstEntryTutorial({
    hasUser: true,
    hasPet: true,
    pathname: '/',
    completedAt: tutorialState?.completed_at ?? null,
    dismissedAt: tutorialState?.dismissed_at ?? null,
  })

  return (
    <CalendarHome
      pet={calendarPet}
      diaries={diaries}
      showFirstEntryTutorial={showFirstEntryTutorial}
      themeKey={themeKey}
    />
  )
}

function AnonymousLanding() {
  const devBypassEnabled = isDevAuthBypassEnabled()

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-5xl flex-col justify-center gap-10 px-5 py-10 md:grid md:grid-cols-[0.92fr_1.08fr] md:items-center md:gap-14 md:px-8">
      <section className="flex flex-col gap-7 text-left">
        <div className="flex items-center gap-3">
          <BuddyHappy className="h-16 w-20" />
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--color-mute)]">
              memory album
            </p>
            <p className="mt-1 font-serif text-[22px] font-semibold text-[var(--color-ink)]">
              buddy-note
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-4">
          <h1 className="font-serif text-[var(--text-display-sm)] font-semibold leading-[1.12] text-[var(--color-ink)] md:text-[var(--text-display-md)]">
            내 강아지가
            <br />
            자기답게 남기는 하루
          </h1>
          <p className="max-w-[29rem] text-[15px] leading-[1.75] text-[var(--color-ink-soft)]">
            사진 한 장과 짧은 메모가 쌓이면, 버디의 말투와 습관을 기억하는
            앨범이 돼요.
          </p>
          <div className="flex flex-wrap gap-2">
            {['성격 기억', '사진 일기', '월간 앨범'].map((label) => (
              <span
                key={label}
                className="rounded-[var(--radius-pill)] bg-[var(--color-accent-brand-soft)] px-3 py-1 text-[12px] font-semibold text-[var(--color-accent-brand)]"
              >
                {label}
              </span>
            ))}
          </div>
        </div>

        <div className="flex w-full max-w-[340px] flex-col gap-3">
          <Link
            href="/auth/login"
            className="inline-flex min-h-12 items-center justify-center rounded-[var(--radius-button)] bg-[var(--color-accent-cta)] px-6 text-[15px] font-semibold text-[var(--primary-foreground)] shadow-[var(--shadow-accent)] transition-opacity duration-200 hover:opacity-90"
          >
            카카오로 시작하기
          </Link>
          {devBypassEnabled ? (
            <Link
              href="/auth/dev"
              className="inline-flex min-h-12 items-center justify-center rounded-[var(--radius-button)] border border-[var(--color-line)] bg-[var(--color-bg)] px-6 text-[15px] font-semibold text-[var(--color-ink-soft)] transition-colors duration-200 hover:bg-[var(--color-paper)]"
            >
              로컬 개발 로그인
            </Link>
          ) : null}
        </div>
      </section>

      <section
        aria-label="buddy-note 미리보기"
        className="relative mx-auto w-full max-w-[430px] pt-6"
      >
        <div className="absolute right-2 top-0 z-10 rounded-[var(--radius-pill)] border border-[var(--color-line)] bg-[var(--color-bg)] px-3 py-1 font-serif text-[14px] font-semibold text-[var(--color-ink)] shadow-[var(--shadow-card-soft)]">
          259일째
        </div>
        <div className="relative bg-[var(--color-paper)] p-5 pb-10 shadow-[var(--shadow-polaroid)] ring-1 ring-[var(--color-line)] motion-safe:-rotate-[1.2deg]">
          <div className="grid aspect-square grid-cols-3 grid-rows-3 gap-1 bg-[var(--color-bg)] p-1">
            {[
              'bg-[var(--color-mood-bright)]',
              'bg-[var(--color-line)]',
              'bg-[var(--color-mood-calm)]',
              'bg-[var(--color-paper)]',
              'bg-[var(--color-accent-brand-soft)]',
              'bg-[var(--color-mood-curious)]',
              'bg-[var(--color-mood-tired)]',
              'bg-[var(--color-bg)]',
              'bg-[var(--color-mood-lonely)]',
            ].map((className, index) => (
              <div
                key={index}
                className={`${className} relative overflow-hidden`}
              >
                {index === 4 ? (
                  <BuddyHappy className="absolute inset-0 m-auto h-16 w-20 opacity-80" />
                ) : null}
              </div>
            ))}
          </div>

          <div className="mt-5 flex items-start justify-between gap-5">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--color-mute)]">
                오늘의 기억
              </p>
              <h2 className="mt-2 font-serif text-[30px] font-semibold leading-none text-[var(--color-ink)]">
                마루
              </h2>
              <p className="mt-3 max-w-[16rem] font-serif text-[15px] leading-[1.7] text-[var(--color-ink-soft)]">
                오늘은 창가 냄새를 오래 맡았다. 내가 지키는 오후가 꽤
                근사했다.
              </p>
            </div>
            <span className="shrink-0 rounded-[var(--radius-pill)] bg-[var(--color-accent-brand-soft)] px-2.5 py-1 text-[11px] font-semibold text-[var(--color-accent-brand)]">
              NF · 다정한 관찰자
            </span>
          </div>
        </div>
      </section>
    </main>
  )
}
