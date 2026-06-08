'use client'

import Image from 'next/image'
import Link from 'next/link'
import type { CSSProperties } from 'react'
import { useMemo, useState } from 'react'
import { Bell } from 'lucide-react'

import { ShareModal } from '@/app/diary/[id]/share-modal'
import { UploadForm } from '@/app/log/upload-form'
import { DiaryDetailCard } from '@/components/diary/diary-detail-card'
import { RewriteDiaryButton } from '@/components/diary/rewrite-diary-button'
import { EmptyState } from '@/components/empty/empty-state'
import { PawPrint } from '@/components/icons/paw-print'
import { FirstEntryTutorialSheet } from '@/components/tutorial/first-entry-tutorial-sheet'
import { CountUp } from '@/lib/motion/count-up'
import { MOOD_CSS_VAR } from '@/lib/mood'
import { shouldShowUnreadNotificationDot } from '@/lib/notifications/state'
import type { ThemePresetKey } from '@/lib/themes/presets'
import { buildThemeStyle } from '@/lib/themes/style'
import type { DiaryMood } from '@/types/database'

export type CalendarPet = {
  id: string
  name: string
  createdAt: string
  personalityCode: string | null
  personalityLabel: string | null
  companionRelationship?: string | null
}

export type CalendarDiary = {
  id: string
  title: string
  body: string
  shareImages: {
    '9:16': string | null
    '4:5': string | null
    '1:1': string | null
  }
  imageUrl: string | null
  mood: DiaryMood | null
  logDate: string
  createdAt: string
}

type CalendarDay = {
  key: string
  day: number
  inMonth: boolean
  isToday: boolean
  isFuture: boolean
  diary: CalendarDiary | null
}

const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토']

function todayInSeoul(): string {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Seoul',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date())
  const year = parts.find((p) => p.type === 'year')?.value ?? '1970'
  const month = parts.find((p) => p.type === 'month')?.value ?? '01'
  const day = parts.find((p) => p.type === 'day')?.value ?? '01'
  return `${year}-${month}-${day}`
}

function dateKey(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

function parseDateKey(key: string): Date {
  const [y, m, d] = key.split('-').map(Number)
  return new Date(y ?? 1970, (m ?? 1) - 1, d ?? 1)
}

function monthLabel(date: Date): string {
  return `${date.getFullYear()}년 ${date.getMonth() + 1}월`
}

function longDateLabel(key: string): string {
  const d = parseDateKey(key)
  return `${d.getFullYear()}년 ${d.getMonth() + 1}월 ${d.getDate()}일`
}

function compactDateLabel(key: string): string {
  const [year, month, day] = key.split('-')
  if (!year || !month || !day) return ''
  return `${year}.${month}.${day}`
}

function daysSince(iso: string): number {
  const start = new Date(iso).getTime()
  if (Number.isNaN(start)) return 1
  const diff = Date.now() - start
  return Math.max(1, Math.floor(diff / 86_400_000) + 1)
}

function buildMonthDays(
  month: Date,
  diariesByDate: Map<string, CalendarDiary>,
  todayKey: string,
): CalendarDay[] {
  const first = new Date(month.getFullYear(), month.getMonth(), 1)
  const start = new Date(first)
  start.setDate(first.getDate() - first.getDay())

  return Array.from({ length: 42 }, (_, i) => {
    const d = new Date(start)
    d.setDate(start.getDate() + i)
    const key = dateKey(d)
    return {
      key,
      day: d.getDate(),
      inMonth: d.getMonth() === month.getMonth(),
      isToday: key === todayKey,
      isFuture: key > todayKey,
      diary: diariesByDate.get(key) ?? null,
    }
  })
}

export function CalendarHome({
  pet,
  diaries,
  unreadNotificationCount = 0,
  showFirstEntryTutorial = false,
  themeKey = null,
  canRewrite = false,
  diaryFontCssValue = 'var(--font-diary-body)',
}: {
  pet: CalendarPet
  diaries: CalendarDiary[]
  unreadNotificationCount?: number
  showFirstEntryTutorial?: boolean
  themeKey?: ThemePresetKey | null
  canRewrite?: boolean
  diaryFontCssValue?: string
}) {
  const todayKey = todayInSeoul()
  const [activeMonth, setActiveMonth] = useState(() => {
    const today = parseDateKey(todayKey)
    return new Date(today.getFullYear(), today.getMonth(), 1)
  })
  const [selectedKey, setSelectedKey] = useState<string | null>(null)

  const diariesByDate = useMemo(() => {
    const map = new Map<string, CalendarDiary>()
    for (const diary of diaries) map.set(diary.logDate, diary)
    return map
  }, [diaries])

  const days = useMemo(
    () => buildMonthDays(activeMonth, diariesByDate, todayKey),
    [activeMonth, diariesByDate, todayKey],
  )

  const selectedDiary = selectedKey
    ? diariesByDate.get(selectedKey) ?? null
    : null
  const selectedIsFuture = selectedKey ? selectedKey > todayKey : false
  const dayN = daysSince(pet.createdAt)
  const themeStyle = buildThemeStyle(themeKey) as CSSProperties

  // A3 — 일기 0개 상태: EmptyState hero로 전환
  if (diaries.length === 0) {
    return (
      <>
        <main
          className="mx-auto flex min-h-screen w-full max-w-md flex-col gap-8 px-4 py-12"
          style={themeStyle}
        >
          <HomePetHeader
            pet={pet}
            dayN={dayN}
            unreadNotificationCount={unreadNotificationCount}
          />
          <EmptyState
            illustration="resting"
            tone="warm"
            title={`${pet.name}의 첫 페이지를 채워볼까?`}
            hint="사진 한 장이면 버디가 오늘을 직접 적어줘."
            cta={{ label: '첫 기록 남기기', href: '/log' }}
          />
        </main>
        {showFirstEntryTutorial ? <FirstEntryTutorialSheet /> : null}
      </>
    )
  }

  function moveMonth(delta: number) {
    setActiveMonth((current) => {
      const next = new Date(current)
      next.setMonth(current.getMonth() + delta)
      return next
    })
    setSelectedKey(null)
  }

  return (
    <main
      className="mx-auto flex min-h-screen w-full max-w-3xl flex-col gap-6 px-4 pb-28 pt-8 sm:px-6 md:pt-10"
      style={themeStyle}
    >
      <HomePetHeader
        pet={pet}
        dayN={dayN}
        unreadNotificationCount={unreadNotificationCount}
      />

      <section
        aria-label="월간 기록 달력"
        className="flex flex-col gap-4"
      >
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => moveMonth(-1)}
            className="min-h-11 rounded-[var(--radius-button)] px-3 text-[14px] font-medium text-[var(--color-ink-soft)] transition-colors hover:bg-[var(--color-paper)]"
          >
            이전
          </button>
          <h2 className="text-[20px] font-bold text-[var(--color-ink)]">
            {monthLabel(activeMonth)}
          </h2>
          <button
            type="button"
            onClick={() => moveMonth(1)}
            className="min-h-11 rounded-[var(--radius-button)] px-3 text-[14px] font-medium text-[var(--color-ink-soft)] transition-colors hover:bg-[var(--color-paper)]"
          >
            다음
          </button>
        </div>

        <div className="grid grid-cols-7 gap-1 text-center">
          {WEEKDAYS.map((day) => (
            <div
              key={day}
              className="py-2 text-[12px] font-medium text-[var(--color-mute)]"
            >
              {day}
            </div>
          ))}
          {days.map((day) => {
            const selected = selectedKey === day.key
            const hasThumb = Boolean(day.diary?.imageUrl)
            return (
              <button
                key={day.key}
                type="button"
                onClick={() => {
                  if (!day.inMonth || day.isFuture) return
                  setSelectedKey(day.key)
                }}
                disabled={!day.inMonth || day.isFuture}
                aria-pressed={selected}
                aria-label={`${longDateLabel(day.key)}${day.diary ? ', 기록 있음' : ''}`}
                className={[
                  'relative flex aspect-square min-h-12 overflow-hidden flex-col items-center justify-center rounded-[var(--radius-input)] border text-[14px] transition-colors',
                  day.inMonth
                    ? 'border-[var(--color-line)] bg-[var(--color-bg)] text-[var(--color-ink)]'
                    : 'border-transparent bg-transparent text-[var(--color-line)]',
                  day.isFuture
                    ? 'cursor-not-allowed opacity-35'
                    : 'hover:border-[var(--color-accent-brand)]',
                  selected
                    ? 'ring-2 ring-[var(--color-accent-brand)] ring-offset-1'
                    : '',
                  day.isToday && !selected
                    ? 'ring-1 ring-[var(--color-accent-brand)]'
                    : '',
                ].join(' ')}
              >
                {/* A2 — mini-thumb: 일기 + 사진이 있으면 꽉 채운 이미지 */}
                {hasThumb && day.diary?.imageUrl ? (
                  <>
                    <CalendarThumbnail
                      imageUrl={day.diary.imageUrl}
                      mood={day.diary.mood}
                    />
                    {/* day number — 흰색 chip */}
                    <span className="absolute left-1 top-1 z-10 rounded-[2px] bg-white/90 px-1 text-[10px] font-semibold leading-tight text-[var(--color-ink)]">
                      {day.day}
                    </span>
                    {/* 하단 mood bar */}
                    <span
                      className="absolute bottom-0 left-0 right-0 z-10 h-1"
                      style={{
                        backgroundColor: day.diary.mood
                          ? MOOD_CSS_VAR[day.diary.mood]
                          : 'var(--color-accent-brand)',
                      }}
                    />
                  </>
                ) : (
                  <>
                    <span>{day.day}</span>
                    {day.diary ? (
                      <>
                        <PawPrint
                          className="mt-1 h-3.5 w-3.5"
                          color={
                            day.diary.mood
                              ? MOOD_CSS_VAR[day.diary.mood]
                              : 'var(--color-accent-brand)'
                          }
                        />
                        {/* 하단 mood bar (이미지 없는 일기도) */}
                        <span
                          className="absolute bottom-0 left-0 right-0 h-1"
                          style={{
                            backgroundColor: day.diary.mood
                              ? MOOD_CSS_VAR[day.diary.mood]
                              : 'var(--color-accent-brand)',
                          }}
                        />
                      </>
                    ) : null}
                  </>
                )}
              </button>
            )
          })}
        </div>
      </section>

      {selectedKey ? (
        <CalendarSheet
          pet={pet}
          dateKeyValue={selectedKey}
          diary={selectedDiary}
          isFuture={selectedIsFuture}
          canRewrite={canRewrite}
          diaryFontCssValue={diaryFontCssValue}
          onClose={() => setSelectedKey(null)}
        />
      ) : null}
      {showFirstEntryTutorial ? <FirstEntryTutorialSheet /> : null}
    </main>
  )
}

function HomePetHeader({
  pet,
  dayN,
  unreadNotificationCount,
}: {
  pet: CalendarPet
  dayN: number
  unreadNotificationCount: number
}) {
  return (
    <header className="flex items-start justify-between gap-4">
      <div className="min-w-0 flex flex-col gap-2">
        <h1 className="truncate text-[var(--text-display-md)] font-semibold leading-[1.05] text-[var(--color-ink)]">
          {pet.name}
        </h1>
        <div className="flex flex-wrap items-baseline gap-3">
          <CountUp
            to={dayN}
            suffix="일째"
            className="text-[20px] font-semibold text-[var(--theme-accent,var(--color-accent-brand))]"
          />
          {pet.personalityCode && pet.personalityLabel ? (
            <span className="rounded-[var(--radius-pill)] bg-[var(--theme-accent-soft,var(--color-accent-brand-soft))] px-2.5 py-0.5 text-[11px] font-semibold tracking-[0.06em] text-[var(--theme-accent,var(--color-accent-brand))]">
              {pet.personalityCode} · {pet.personalityLabel}
            </span>
          ) : (
            <span className="text-[12px] text-[var(--color-mute)]">
              하루에 한 장씩, 기억을 남겨요.
            </span>
          )}
        </div>
      </div>
      <Link
        href="/notifications"
        aria-label={
          unreadNotificationCount > 0
            ? `읽지 않은 알림 ${unreadNotificationCount}개 확인하기`
            : '최근 알림 확인하기'
        }
        className="relative mt-1 inline-flex size-10 shrink-0 items-center justify-center rounded-[var(--radius-button)] text-[var(--color-ink-soft)] transition-colors hover:bg-[var(--color-paper)] hover:text-[var(--color-ink)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--theme-accent,var(--color-accent-brand))] focus-visible:ring-offset-2"
      >
        <Bell aria-hidden className="size-5" strokeWidth={1.9} />
        {shouldShowUnreadNotificationDot(unreadNotificationCount) ? (
          <span className="absolute right-2 top-2 h-2.5 w-2.5 rounded-full bg-[var(--color-error)] ring-2 ring-[var(--color-bg)]" />
        ) : null}
      </Link>
    </header>
  )
}

function CalendarThumbnail({
  imageUrl,
  mood,
}: {
  imageUrl: string
  mood: DiaryMood | null
}) {
  const [loaded, setLoaded] = useState(false)
  const color = mood ? MOOD_CSS_VAR[mood] : 'var(--color-accent-brand)'

  return (
    <>
      <span className="absolute inset-0 flex items-center justify-center bg-[var(--color-paper)]">
        <PawPrint className="h-5 w-5 opacity-75" color={color} />
      </span>
      <Image
        src={imageUrl}
        alt=""
        fill
        sizes="(max-width: 640px) 14vw, 80px"
        onLoad={() => setLoaded(true)}
        className={[
          'absolute inset-0 object-cover transition-opacity duration-200',
          loaded ? 'opacity-100' : 'opacity-0',
        ].join(' ')}
      />
    </>
  )
}

function CalendarSheet({
  pet,
  dateKeyValue,
  diary,
  isFuture,
  canRewrite,
  diaryFontCssValue,
  onClose,
}: {
  pet: CalendarPet
  dateKeyValue: string
  diary: CalendarDiary | null
  isFuture: boolean
  canRewrite: boolean
  diaryFontCssValue: string
  onClose: () => void
}) {
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby={diary ? 'calendar-diary-title' : 'calendar-sheet-title'}
      className="fixed inset-x-0 top-0 bottom-[var(--bottom-nav-height)] z-30 flex items-end justify-center bg-[var(--color-ink)]/20 px-3 motion-safe:animate-[soft-fade_200ms_var(--ease-soft-out)_forwards] motion-reduce:opacity-100"
      onClick={onClose}
    >
      <section
        className="max-h-[86vh] w-full max-w-md overflow-y-auto rounded-t-[var(--radius-card)] border border-[var(--color-line)] bg-[var(--color-bg)] px-4 pb-10 pt-4 shadow-[var(--shadow-polaroid)] [-ms-overflow-style:none] [scrollbar-width:none] motion-safe:animate-[bottom-sheet-enter_260ms_cubic-bezier(0.2,0.9,0.25,1)_both] motion-reduce:animate-[soft-fade_200ms_forwards] [&::-webkit-scrollbar]:hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mx-auto mb-4 h-1 w-10 rounded-[var(--radius-pill)] bg-[var(--color-line)]" />
        {!diary ? (
          <div className="mb-5 flex items-start justify-between gap-4">
            <div className="flex flex-col gap-1">
              <p className="text-[12px] font-medium uppercase tracking-[0.14em] text-[var(--color-mute)]">
                {longDateLabel(dateKeyValue)}
              </p>
              <h2
                id="calendar-sheet-title"
                className="text-[20px] font-semibold text-[var(--color-ink)]"
              >
                {`${pet.name}의 기록 남기기`}
              </h2>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="min-h-11 rounded-[var(--radius-button)] px-3 text-[13px] text-[var(--color-mute)] transition-colors hover:bg-[var(--color-paper)]"
            >
              닫기
            </button>
          </div>
        ) : null}

        {isFuture ? (
          <p className="rounded-[var(--radius-input)] bg-[var(--color-paper)] px-4 py-3 text-[14px] text-[var(--color-ink-soft)]">
            아직 오지 않은 날은 기록할 수 없어요.
          </p>
        ) : diary ? (
          <DiaryPreview
            diary={diary}
            petName={pet.name}
            canRewrite={canRewrite}
            diaryFontCssValue={diaryFontCssValue}
          />
        ) : (
          <UploadForm
            petId={pet.id}
            petName={pet.name}
            logDate={dateKeyValue}
            compact
          />
        )}
      </section>
    </div>
  )
}

function DiaryPreview({
  diary,
  petName,
  canRewrite,
  diaryFontCssValue,
}: {
  diary: CalendarDiary
  petName: string
  canRewrite: boolean
  diaryFontCssValue: string
}) {
  return (
    <div className="flex flex-col gap-3">
      <DiaryDetailCard
        titleId="calendar-diary-title"
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
          returnTo="/"
          fullWidth
        />
      </div>
    </div>
  )
}
