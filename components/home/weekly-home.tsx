'use client'

import Image from 'next/image'
import Link from 'next/link'
import type { CSSProperties, KeyboardEvent, PointerEvent, ReactNode } from 'react'
import { useState } from 'react'

import { ShareModal } from '@/app/diary/[id]/share-modal'
import { DiaryDetailCard } from '@/components/diary/diary-detail-card'
import { RewriteDiaryButton } from '@/components/diary/rewrite-diary-button'
import { BuddyAvatar } from '@/components/home/buddy-avatar'
import { EmptyState } from '@/components/empty/empty-state'
import { PawPrint } from '@/components/icons/paw-print'
import { buildBuddyGreeting } from '@/lib/greeting'
import { CountUp } from '@/lib/motion/count-up'
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
  shareImages: {
    '9:16': string | null
    '4:5': string | null
    '1:1': string | null
  }
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
  canRewrite: boolean
  diaryFontCssValue: string
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

function compactDateLabel(key: string): string {
  const [year, month, day] = key.split('-')
  if (!year || !month || !day) return ''
  return `${year}.${month}.${day}`
}

export function WeeklyHome({
  pet,
  diaries,
  diaryCount,
  recentCallbacks,
  todayHasDiary,
  canRewrite,
  diaryFontCssValue,
}: WeeklyHomeProps) {
  const dayN = daysSince(pet.createdAt)
  const greeting = buildBuddyGreeting({ personalityCode: pet.personalityCode })
  const [selectedDiary, setSelectedDiary] = useState<WeeklyDiary | null>(null)

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-3xl flex-col gap-7 px-4 pb-28 pt-8 sm:px-6 md:pt-10">
      <section className="rounded-[var(--radius-card)] border border-[var(--color-line)] bg-[var(--color-paper)] px-5 py-6 shadow-[var(--shadow-card)]">
        <div className="flex items-start gap-4">
          <BuddyAvatar name={pet.name} imageUrl={pet.avatarUrl} size="lg" />
          <div className="min-w-0 flex-1">
            <h1 className="truncate text-[var(--text-display-md)] font-semibold leading-none text-[var(--color-ink)]">
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
          <Stat label="함께한 날" value={<CountUp to={dayN} suffix="일째" />} />
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
            <h2 className="text-[20px] font-semibold text-[var(--color-ink)]">
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
            {diaries.map((diary) => (
              <TimelineCard
                key={diary.id}
                diary={diary}
                onOpen={() => setSelectedDiary(diary)}
              />
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

      {selectedDiary ? (
        <WeeklyDiarySheet
          diary={selectedDiary}
          petName={pet.name}
          canRewrite={canRewrite}
          diaryFontCssValue={diaryFontCssValue}
          onClose={() => setSelectedDiary(null)}
        />
      ) : null}
    </main>
  )
}

function Stat({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="rounded-[var(--radius-button)] bg-[var(--color-bg)]/70 px-4 py-3">
      <p className="text-[12px] text-[var(--color-mute)]">{label}</p>
      <p className="mt-1 text-[24px] font-semibold leading-none text-[var(--color-ink)]">
        {value}
      </p>
    </div>
  )
}

function CallbackStrip({ callbacks }: { callbacks: RecentCallback[] }) {
  const callback = callbacks[0]

  return (
    <section className="rounded-[var(--radius-card)] border border-[var(--color-line)] bg-[var(--color-bg)] px-5 py-4">
      <p className="text-[15px] leading-[1.65] text-[var(--color-ink-soft)]">
        {callback
          ? `전에 ${callback.note} 했던 거, 내가 아직 기억하고 있어.`
          : '3일만 더 쌓이면, 내가 자주 하는 행동을 먼저 기억해볼게.'}
      </p>
    </section>
  )
}

function TimelineCard({
  diary,
  onOpen,
}: {
  diary: WeeklyDiary
  onOpen: () => void
}) {
  const accent = diary.mood ? MOOD_CSS_VAR[diary.mood] : 'var(--color-accent-brand)'
  const openDiary = () => onOpen()
  const handleKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    if (event.key !== 'Enter' && event.key !== ' ') return
    event.preventDefault()
    openDiary()
  }
  const handlePointerUp = (event: PointerEvent<HTMLButtonElement>) => {
    if (event.pointerType === 'mouse') return
    openDiary()
  }

  return (
    <div className="group/card w-[72vw] max-w-[280px] shrink-0 snap-start">
      <article
        className={[
          'bg-[var(--color-paper)] p-4 pb-8 ring-1 ring-[var(--color-line)] shadow-[var(--shadow-card)]',
          'motion-safe:transition-transform motion-safe:duration-200 motion-safe:group-hover/card:-translate-y-0.5',
        ].join(' ')}
      >
        <button
          type="button"
          aria-label={`${shortDate(diary.logDate)} ${diary.title} 일기 보기`}
          onClick={openDiary}
          onKeyDown={handleKeyDown}
          onPointerUp={handlePointerUp}
          className="block w-full cursor-pointer text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent-brand)] focus-visible:ring-offset-2"
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
          <p className="diary-writing-font mt-2 line-clamp-2 text-[14px] leading-[1.65] text-[var(--color-ink-soft)]">
            {diary.body}
          </p>
        </button>
      </article>
    </div>
  )
}

function WeeklyDiarySheet({
  diary,
  petName,
  canRewrite,
  diaryFontCssValue,
  onClose,
}: {
  diary: WeeklyDiary
  petName: string
  canRewrite: boolean
  diaryFontCssValue: string
  onClose: () => void
}) {
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="weekly-diary-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-[var(--color-ink)]/30 px-4 py-6 motion-safe:animate-[soft-fade_200ms_var(--ease-soft-out)_forwards] motion-reduce:opacity-100"
      onClick={onClose}
    >
      <section
        className="max-h-[min(86vh,760px)] w-full max-w-md overflow-y-auto rounded-[var(--radius-card)] border border-[var(--color-line)] bg-[var(--color-bg)] px-4 pb-6 pt-4 shadow-[var(--shadow-polaroid)] [-ms-overflow-style:none] [scrollbar-width:none] motion-safe:animate-[soft-fade_200ms_var(--ease-soft-out)_forwards] motion-reduce:animate-[soft-fade_200ms_forwards] [&::-webkit-scrollbar]:hidden"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="mb-4 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="min-h-11 rounded-[var(--radius-button)] px-3 text-[13px] text-[var(--color-mute)] transition-colors hover:bg-[var(--color-paper)]"
          >
            닫기
          </button>
        </div>

        <div className="flex flex-col gap-3">
          <DiaryDetailCard
            titleId="weekly-diary-title"
            title={diary.title}
            body={diary.body}
            dateLabel={compactDateLabel(diary.logDate)}
            petName={petName}
            imageUrl={diary.imageUrl}
            style={{ '--font-diary-writing': diaryFontCssValue } as CSSProperties}
          />
          <div className="flex flex-col gap-2 px-1">
            <ShareModal
              diaryId={diary.id}
              title={diary.title}
              petName={petName}
              images={diary.shareImages}
            />
            <RewriteDiaryButton
              diaryId={diary.id}
              canRewrite={canRewrite}
              returnTo="/week"
              fullWidth
            />
          </div>
        </div>
      </section>
    </div>
  )
}
