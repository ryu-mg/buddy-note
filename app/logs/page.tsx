import Link from 'next/link'
import { redirect } from 'next/navigation'
import type { ReactNode } from 'react'
import {
  BarChart3,
  CalendarDays,
  Clock3,
  NotebookText,
  type LucideIcon,
} from 'lucide-react'

import { BackLink } from '@/components/layout/back-link'
import {
  MonthGroup,
  type HistoryDiaryCard,
} from '@/components/logs/month-group'
import { buildLogStats, type CountBucket } from '@/lib/logs/stats'
import { createClient } from '@/lib/supabase/server'
import { getSignedPhotoUrl } from '@/lib/storage'

export const dynamic = 'force-dynamic'

type PetSummary = {
  id: string
  name: string
  created_at: string
}

type DiaryHistoryRow = {
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

type DiaryStatsRow = {
  created_at: string
  log: {
    log_date: string
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
    .select('id, name, created_at')
    .eq('user_id', user.id)
    .limit(1)
    .maybeSingle<PetSummary>()

  if (!pet) {
    redirect('/onboarding')
  }

  const [historyResult, statsResult] = await Promise.all([
    supabase
      .from('diaries')
      .select(
        'id, title, body, image_url_45, image_url_11, created_at, log:logs(log_date, photo_url, photo_storage_path)',
      )
      .eq('pet_id', pet.id)
      .order('created_at', { ascending: false })
      .limit(120)
      .returns<DiaryHistoryRow[]>(),
    supabase
      .from('diaries')
      .select('created_at, log:logs(log_date)')
      .eq('pet_id', pet.id)
      .returns<DiaryStatsRow[]>(),
  ])

  const rows = historyResult.data ?? []
  const statsRows = statsResult.data ?? rows
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
  const stats = buildLogStats({
    petCreatedAt: pet.created_at,
    diaries: statsRows.map((diary) => ({
      createdAt: diary.created_at,
      logDate: diary.log?.log_date ?? null,
    })),
  })
  const mostActiveMonth = stats.monthBuckets.reduce<CountBucket | null>(
    (best, bucket) => {
      if (!best || bucket.count > best.count) return bucket
      return best
    },
    null,
  )
  const mostActiveWeekday = stats.weekdayBuckets.reduce<CountBucket | null>(
    (best, bucket) => {
      if (!best || bucket.count > best.count) return bucket
      return best
    },
    null,
  )

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-5xl flex-col gap-8 px-4 pb-24 pt-6 sm:px-6 md:gap-10 md:pt-8">
      <header className="flex flex-col gap-5">
        <div>
          <BackLink href="/more" label="더보기로 돌아가기" />
        </div>
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div className="flex flex-col gap-1">
            <h1 className="text-[24px] font-semibold leading-[1.25] text-[var(--color-ink)] md:text-[28px]">
              {pet.name}의 기록 통계
            </h1>
            <p className="text-[13px] leading-[1.5] text-[var(--color-mute)]">
              남겨둔 하루가 어떻게 쌓였는지 한눈에 봐요.
            </p>
          </div>
          <Link
            href="/log"
            className="inline-flex min-h-11 items-center justify-center rounded-[var(--radius-button)] bg-[var(--color-accent-cta)] px-4 text-[14px] font-semibold text-[var(--primary-foreground)] shadow-[var(--shadow-accent)] transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent-brand)] focus-visible:ring-offset-2"
          >
            새 일기 쓰기
          </Link>
        </div>
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
            className="mt-2 inline-flex min-h-11 items-center justify-center rounded-[var(--radius-button)] border border-[var(--color-line)] px-4 text-[14px] font-medium text-[var(--color-ink)] transition-opacity hover:opacity-80"
          >
            첫 일기 쓰기
          </Link>
        </section>
      ) : (
        <>
          <section
            aria-label="기록 요약"
            className="grid grid-cols-2 gap-3 md:grid-cols-4"
          >
            <StatCard
              icon={CalendarDays}
              label="시작한 날짜"
              value={formatDate(stats.startedDate)}
              description={`${stats.daysSinceStarted}일째 함께 쓰고 있어요`}
            />
            <StatCard
              icon={NotebookText}
              label="총 입력한 일기"
              value={`${stats.totalCount}개`}
              description={`${stats.activeDayCount}일에 기록을 남겼어요`}
            />
            <StatCard
              icon={Clock3}
              label="첫 기록"
              value={formatDate(stats.firstDiaryDate)}
              description={`최근 기록은 ${formatDate(stats.latestDiaryDate)}예요`}
            />
            <StatCard
              icon={BarChart3}
              label="가장 많이 쓴 때"
              value={mostActiveMonth?.count ? mostActiveMonth.label : '-'}
              description={
                mostActiveWeekday?.count
                  ? `${mostActiveWeekday.label}요일에 자주 남겼어요`
                  : '기록이 쌓이면 리듬이 보여요'
              }
            />
          </section>

          <section className="grid gap-4 md:grid-cols-[minmax(0,1.35fr)_minmax(280px,0.65fr)]">
            <ChartPanel
              title="월별 기록"
              description="최근 6개월 동안 남긴 일기 수예요."
            >
              <div className="flex h-52 items-end gap-3 pt-4">
                {stats.monthBuckets.map((bucket) => (
                  <VerticalBar key={bucket.key} bucket={bucket} />
                ))}
              </div>
            </ChartPanel>

            <ChartPanel
              title="요일 리듬"
              description="어떤 요일에 더 자주 말을 남겼는지 봐요."
            >
              <div className="flex flex-col gap-3 pt-3">
                {stats.weekdayBuckets.map((bucket) => (
                  <HorizontalBar key={bucket.key} bucket={bucket} />
                ))}
              </div>
            </ChartPanel>
          </section>

          <section className="flex flex-col gap-12">
            <header className="flex items-baseline justify-between border-b border-[var(--color-line)] pb-3">
              <div>
                <h2 className="text-[18px] font-semibold leading-[1.35] text-[var(--color-ink)]">
                  최근 기록
                </h2>
                <p className="mt-1 text-[13px] leading-[1.5] text-[var(--color-mute)]">
                  통계 아래에서 지난 일기를 다시 볼 수 있어요.
                </p>
              </div>
            </header>

            {months.map((month) => (
              <MonthGroup
                key={month.key}
                label={month.label}
                count={month.diaries.length}
                diaries={month.diaries}
              />
            ))}
          </section>
        </>
      )}
    </main>
  )
}

type StatCardProps = {
  icon: LucideIcon
  label: string
  value: string
  description: string
}

function StatCard({ icon: Icon, label, value, description }: StatCardProps) {
  return (
    <article className="flex min-h-36 flex-col justify-between rounded-[var(--radius-card)] border border-[var(--color-line)] bg-[var(--color-paper)] p-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-[12px] font-medium text-[var(--color-mute)]">
          {label}
        </p>
        <Icon aria-hidden className="size-4 text-[var(--color-accent-brand)]" />
      </div>
      <div className="flex flex-col gap-2">
        <strong className="text-[24px] font-semibold leading-none text-[var(--color-ink)]">
          {value}
        </strong>
        <p className="text-[12px] leading-[1.45] text-[var(--color-ink-soft)]">
          {description}
        </p>
      </div>
    </article>
  )
}

function ChartPanel({
  title,
  description,
  children,
}: {
  title: string
  description: string
  children: ReactNode
}) {
  return (
    <section className="rounded-[var(--radius-card)] border border-[var(--color-line)] bg-[var(--color-bg)] p-5 shadow-[var(--shadow-card)]">
      <div className="flex flex-col gap-1">
        <h2 className="text-[18px] font-semibold text-[var(--color-ink)]">
          {title}
        </h2>
        <p className="text-[13px] leading-[1.5] text-[var(--color-mute)]">
          {description}
        </p>
      </div>
      {children}
    </section>
  )
}

function VerticalBar({ bucket }: { bucket: CountBucket }) {
  const height = bucket.count === 0 ? 10 : Math.max(22, bucket.ratio * 148)

  return (
    <div className="flex min-w-0 flex-1 flex-col items-center gap-2">
      <span className="text-[12px] font-medium text-[var(--color-ink-soft)]">
        {bucket.count}
      </span>
      <div className="flex h-[148px] w-full items-end rounded-[var(--radius-button)] bg-[var(--color-paper)] p-1">
        <div
          className="w-full rounded-[var(--radius-button)] bg-[var(--color-accent-brand)]/80"
          style={{ height }}
        />
      </div>
      <span className="text-[12px] text-[var(--color-mute)]">
        {bucket.label}
      </span>
    </div>
  )
}

function HorizontalBar({ bucket }: { bucket: CountBucket }) {
  const width = bucket.count === 0 ? 4 : Math.max(16, bucket.ratio * 100)

  return (
    <div className="grid grid-cols-[24px_minmax(0,1fr)_28px] items-center gap-3">
      <span className="text-[12px] font-medium text-[var(--color-ink-soft)]">
        {bucket.label}
      </span>
      <div className="h-3 overflow-hidden rounded-[var(--radius-pill)] bg-[var(--color-paper)]">
        <div
          className="h-full rounded-[var(--radius-pill)] bg-[var(--color-accent-brand)]/80"
          style={{ width: `${width}%` }}
        />
      </div>
      <span className="text-right text-[12px] text-[var(--color-mute)]">
        {bucket.count}
      </span>
    </div>
  )
}

function formatDate(dateKey: string | null): string {
  if (!dateKey) return '-'

  const [year, month, day] = dateKey.split('-')
  if (!year || !month || !day) return '-'

  return `${year}.${month}.${day}`
}
