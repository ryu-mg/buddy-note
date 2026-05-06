import Image from 'next/image'
import Link from 'next/link'

import { BuddyAvatar } from '@/components/home/buddy-avatar'
import { EmptyState } from '@/components/empty/empty-state'
import { PawPrint } from '@/components/icons/paw-print'
import { buildBuddyGreeting } from '@/lib/greeting'
import { MOOD_CSS_VAR, MOOD_LABELS } from '@/lib/mood'
import type { DiaryMood, RecentCallback } from '@/types/database'

type WeeklyPet = {
  id: string
  name: string
  createdAt: string
  avatarUrl: string | null
  personalityCode: string | null
  personalityLabel: string | null
}

type WeeklyDiary = {
  id: string
  title: string
  body: string
  imageUrl: string | null
  logDate: string
  createdAt: string
  mood: DiaryMood | null
}

type WeeklyHomeProps = {
  pet: WeeklyPet
  diaries: WeeklyDiary[]
  diaryCount: number
  recentCallbacks: RecentCallback[]
  todayHasDiary: boolean
}

function daysSince(iso: string): number {
  const start = new Date(iso).getTime()
  if (Number.isNaN(start)) return 1
  return Math.max(1, Math.floor((Date.now() - start) / 86_400_000) + 1)
}

function shortDate(key: string): string {
  const [y, m, d] = key.split('-').map(Number)
  const date = new Date(y ?? 1970, (m ?? 1) - 1, d ?? 1)
  return `${date.getMonth() + 1}월 ${date.getDate()}일`
}

export function WeeklyHome({
  pet,
  diaries,
  diaryCount,
  recentCallbacks,
  todayHasDiary,
}: WeeklyHomeProps) {
  const dayN = daysSince(pet.createdAt)
  const greeting = buildBuddyGreeting({ personalityCode: pet.personalityCode })

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-3xl flex-col gap-7 px-4 pb-28 pt-8 sm:px-6 md:pt-10">
      <section className="rounded-[var(--radius-card)] border border-[var(--color-line)] bg-[var(--color-paper)] px-5 py-6 shadow-[var(--shadow-card)]">
        <div className="flex items-start gap-4">
          <BuddyAvatar name={pet.name} imageUrl={pet.avatarUrl} size="lg" />
          <div className="min-w-0 flex-1">
            <p className="text-[12px] font-medium uppercase tracking-[0.14em] text-[var(--color-mute)]">
              buddy card
            </p>
            <h1 className="mt-1 truncate font-serif text-[var(--text-display-md)] font-semibold leading-none text-[var(--color-ink)]">
              {pet.name}
            </h1>
            {pet.personalityCode && pet.personalityLabel ? (
              <p className="mt-2 text-[14px] font-medium text-[var(--color-accent-brand)]">
                {pet.personalityCode} · {pet.personalityLabel}
              </p>
            ) : null}
            <p className="mt-4 text-[15px] leading-[1.6] text-[var(--color-ink-soft)]">
              {greeting}
            </p>
          </div>
        </div>
        <div className="mt-6 grid grid-cols-2 gap-3">
          <Stat label="함께한 날" value={`${dayN}일째`} />
          <Stat label="버디노트" value={`${diaryCount}장`} />
        </div>
      </section>

      <CallbackStrip callbacks={recentCallbacks} />

      {!todayHasDiary ? (
        <Link
          href="/"
          className="flex items-center justify-between gap-4 rounded-[var(--radius-card)] border border-[var(--color-accent-brand)] bg-[var(--color-accent-brand-soft)] px-5 py-4 text-left transition-transform motion-safe:hover:-translate-y-0.5"
        >
          <span className="flex flex-col gap-1">
            <span className="text-[15px] font-semibold text-[var(--color-ink)]">
              사진 한 장 보여줄래?
            </span>
            <span className="text-[13px] text-[var(--color-ink-soft)]">
              홈에서 오늘 날짜를 눌러 버디노트를 남길 수 있어요.
            </span>
          </span>
          <PawPrint className="h-7 w-7 text-[var(--color-accent-brand)]" />
        </Link>
      ) : null}

      <section className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[12px] font-medium uppercase tracking-[0.14em] text-[var(--color-mute)]">
              this week
            </p>
            <h2 className="mt-1 text-[20px] font-semibold text-[var(--color-ink)]">
              최근 버디노트
            </h2>
          </div>
          <Link
            href="/logs"
            className="text-[13px] font-medium text-[var(--color-ink-soft)] underline-offset-4 hover:underline"
          >
            모아보기
          </Link>
        </div>

        {diaries.length > 0 ? (
          <div className="flex snap-x gap-4 overflow-x-auto pb-3 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {diaries.map((diary, index) => (
              <TimelineCard key={diary.id} diary={diary} tilt={index % 2 === 0 ? 'left' : 'right'} />
            ))}
          </div>
        ) : (
          <EmptyState
            title="아직 내 이야기가 비어 있어"
            hint="사진 한 장이 쌓이면 내가 어떤 하루를 보냈는지 말해볼게."
            cta={{ label: '홈에서 첫 기록 남기기', href: '/' }}
            tone="warm"
            illustration="resting"
          />
        )}
      </section>
    </main>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[var(--radius-button)] bg-[var(--color-bg)]/70 px-4 py-3">
      <p className="text-[12px] text-[var(--color-mute)]">{label}</p>
      <p className="mt-1 font-serif text-[24px] font-semibold leading-none text-[var(--color-ink)]">
        {value}
      </p>
    </div>
  )
}

function CallbackStrip({ callbacks }: { callbacks: RecentCallback[] }) {
  const callback = callbacks[0]

  return (
    <section className="rounded-[var(--radius-card)] border border-[var(--color-line)] bg-[var(--color-bg)] px-5 py-4">
      <p className="text-[12px] font-medium uppercase tracking-[0.14em] text-[var(--color-mute)]">
        remembered
      </p>
      <p className="mt-2 text-[15px] leading-[1.65] text-[var(--color-ink-soft)]">
        {callback
          ? `전에 ${callback.note} 했던 거, 내가 아직 기억하고 있어.`
          : '3일만 더 쌓이면, 내가 자주 하는 행동을 먼저 기억해볼게.'}
      </p>
    </section>
  )
}

function TimelineCard({
  diary,
  tilt,
}: {
  diary: WeeklyDiary
  tilt: 'left' | 'right'
}) {
  const accent = diary.mood ? MOOD_CSS_VAR[diary.mood] : 'var(--color-accent-brand)'

  return (
    <Link
      href={`/diary/${diary.id}`}
      className="group/card w-[72vw] max-w-[280px] shrink-0 snap-start"
    >
      <article
        className={[
          'bg-[var(--color-paper)] p-4 pb-8 ring-1 ring-[var(--color-line)] shadow-[var(--shadow-card)]',
          'motion-safe:transition-transform motion-safe:duration-200 motion-safe:group-hover/card:[transform:rotate(0deg)_translateY(-3px)]',
          tilt === 'left' ? 'motion-safe:-rotate-[1deg]' : 'motion-safe:rotate-[0.8deg]',
        ].join(' ')}
      >
        <div className="relative aspect-[4/5] overflow-hidden bg-[var(--color-line)]">
          {diary.imageUrl ? (
            <Image
              src={diary.imageUrl}
              alt={`${diary.title} 사진`}
              fill
              sizes="280px"
              className="object-cover"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-[12px] text-[var(--color-mute)]">
              사진 없음
            </div>
          )}
          <span
            aria-hidden
            className="absolute bottom-3 left-3 h-2.5 w-2.5 rounded-full"
            style={{ background: accent }}
          />
        </div>
        <p className="mt-4 text-[12px] font-medium text-[var(--color-mute)]">
          {shortDate(diary.logDate)}
          {diary.mood ? ` · ${MOOD_LABELS[diary.mood]}` : ''}
        </p>
        <h3 className="mt-1 line-clamp-1 text-[16px] font-semibold text-[var(--color-ink)]">
          {diary.title}
        </h3>
        <p className="mt-2 line-clamp-2 font-serif text-[14px] leading-[1.65] text-[var(--color-ink-soft)]">
          {diary.body}
        </p>
      </article>
    </Link>
  )
}
