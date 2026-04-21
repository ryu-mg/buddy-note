import Link from 'next/link'
import { redirect } from 'next/navigation'

import {
  MonthGroup,
  type HistoryDiaryCard,
} from '@/components/logs/month-group'
import { createClient } from '@/lib/supabase/server'
import { getSignedPhotoUrl } from '@/lib/storage'

export const dynamic = 'force-dynamic'

type PetSummary = {
  id: string
  name: string
}

type DiaryHistoryRow = {
  id: string
  title: string
  body: string
  image_url_45: string | null
  image_url_11: string | null
  created_at: string
  log: {
    photo_url: string | null
    photo_storage_path: string | null
  } | null
}

type MonthSection = {
  key: string
  label: string
  diaries: HistoryDiaryCard[]
}

function monthKey(iso: string): string {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return 'unknown'
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
}

function monthLabel(iso: string): string {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return '날짜 미상'
  return `${date.getFullYear()}년 ${date.getMonth() + 1}월`
}

function groupByMonth(diaries: HistoryDiaryCard[]): MonthSection[] {
  const groups = new Map<string, MonthSection>()

  for (const diary of diaries) {
    const key = monthKey(diary.createdAt)
    const existing = groups.get(key)
    if (existing) {
      existing.diaries.push(diary)
      continue
    }

    groups.set(key, {
      key,
      label: monthLabel(diary.createdAt),
      diaries: [diary],
    })
  }

  return Array.from(groups.values())
}

export default async function LogsPage() {
  const supabase = await createClient()

  if (!supabase) {
    return (
      <main className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center gap-3 px-6 text-center">
        <h1 className="text-[22px] font-semibold text-[var(--color-ink)]">
          기록을 불러오려면 설정이 필요해요
        </h1>
        <p className="text-[14px] leading-[1.6] text-[var(--color-ink-soft)]">
          Supabase 환경 변수를 먼저 채워주세요.
        </p>
      </main>
    )
  }

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/login')
  }

  const { data: pet } = await supabase
    .from('pets')
    .select('id, name')
    .eq('user_id', user.id)
    .limit(1)
    .maybeSingle<PetSummary>()

  if (!pet) {
    redirect('/onboarding')
  }

  const { data: rowsRaw } = await supabase
    .from('diaries')
    .select(
      'id, title, body, image_url_45, image_url_11, created_at, log:logs(photo_url, photo_storage_path)',
    )
    .eq('pet_id', pet.id)
    .order('created_at', { ascending: false })
    .limit(120)
    .returns<DiaryHistoryRow[]>()

  const rows = rowsRaw ?? []
  const cards = await Promise.all(
    rows.map(async (diary): Promise<HistoryDiaryCard> => {
      let imageUrl: string | null =
        diary.image_url_45 ?? diary.image_url_11 ?? diary.log?.photo_url ?? null

      const path = diary.log?.photo_storage_path
      if (path) {
        const signed = await getSignedPhotoUrl(path)
        if ('url' in signed) {
          imageUrl = signed.url
        }
      }

      return {
        id: diary.id,
        title: diary.title,
        body: diary.body,
        imageUrl,
        createdAt: diary.created_at,
      }
    }),
  )

  const months = groupByMonth(cards)

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-5xl flex-col gap-9 px-4 pb-20 pt-8 sm:px-6 md:gap-12 md:pt-10">
      <header className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div className="flex flex-col gap-1">
          <p className="text-[12px] font-medium uppercase tracking-[0.14em] text-[var(--color-mute)]">
            history
          </p>
          <h1 className="text-[24px] font-semibold leading-[1.25] text-[var(--color-ink)] md:text-[28px]">
            {pet.name}의 기록 모아보기
          </h1>
          <p className="text-[13px] leading-[1.5] text-[var(--color-mute)]">
            최근 기록 {cards.length}개를 월별로 정리했어요.
          </p>
        </div>
        <Link
          href="/log"
          className="inline-flex min-h-11 items-center justify-center rounded-[10px] bg-[var(--color-accent-brand)] px-4 text-[14px] font-semibold text-white transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent-brand)] focus-visible:ring-offset-2"
        >
          새 일기 쓰기
        </Link>
      </header>

      {months.length === 0 ? (
        <section className="mx-auto flex max-w-md flex-col items-center gap-3 py-16 text-center">
          <h2 className="text-[18px] font-semibold text-[var(--color-ink)]">
            아직 모아볼 기록이 없어요
          </h2>
          <p className="text-[14px] leading-[1.6] text-[var(--color-ink-soft)]">
            사진 한 장으로 첫 일기를 남기면 여기에서 월별로 볼 수 있어요.
          </p>
          <Link
            href="/log"
            className="mt-2 inline-flex min-h-11 items-center justify-center rounded-[10px] border border-[var(--color-line)] px-4 text-[14px] font-medium text-[var(--color-ink)] transition-opacity hover:opacity-80"
          >
            첫 일기 쓰기
          </Link>
        </section>
      ) : (
        <div className="flex flex-col gap-12">
          {months.map((month) => (
            <MonthGroup
              key={month.key}
              label={month.label}
              count={month.diaries.length}
              diaries={month.diaries}
            />
          ))}
        </div>
      )}
    </main>
  )
}
