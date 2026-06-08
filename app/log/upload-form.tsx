'use client'

import { useRef, useState, useTransition } from 'react'

import { useRouter } from 'next/navigation'
import { Camera, Plus } from 'lucide-react'
import { toast } from 'sonner'

import { ShutterReveal } from '@/components/diary/shutter-reveal'
import { PhaseCopy } from '@/components/log/phase-copy'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { stripExifClient } from '@/lib/image/exif-strip-client'
import { withJosa } from '@/lib/korean-josa'
import { LOG_TAG_VALUES } from '@/lib/llm/schemas'
import { cn } from '@/lib/utils'
import type { LogTag } from '@/types/database'

import { createLog } from './actions'

type Props = {
  petId: string
  petName: string
  logDate?: string
  compact?: boolean
}

const MAX_MEMO = 500

const MEMO_EXAMPLE_BUILDERS = [
  (name: string) =>
    `오늘은 ${withJosa(name, '이/가')} 다른 날보다 기분이 좋아 보인다! 내일도 우리 같이 산책 가서 냄새 맡기 놀이해야겠어.`,
  (name: string) =>
    `오늘 ${name}에게 새 장난감을 사줬는데 너무 좋아하네. 이번에는 조금만 더 오래 가지고 놀자~`,
  (name: string) =>
    `산책하다가 ${withJosa(name, '이/가')} 작은 나뭇잎 하나에 완전 꽂혔다. 한참 냄새 맡는 모습이 너무 진지해서 웃겼어.`,
  (name: string) =>
    `${withJosa(name, '이/가')} 간식을 받자마자 꼬리가 바빠졌다. 오늘 제일 행복한 순간이 간식 시간인 것 같아.`,
  (name: string) =>
    `오늘은 ${withJosa(name, '이/가')} 내 옆에 딱 붙어서 애교를 많이 부렸다. 덕분에 하루가 훨씬 가벼워졌어.`,
  (name: string) =>
    `${withJosa(name, '이/가')} 공원에서 신나게 뛰었다. 돌아오는 길에도 아직 에너지가 남은 얼굴이라 같이 웃었어.`,
  (name: string) =>
    `${withJosa(name, '이/가')} 공을 던져주자마자 번개처럼 달려갔다. 몇 번을 해도 계속 더 하자는 눈빛이었다.`,
  (name: string) =>
    `오늘 ${withJosa(name, '은/는')} 햇살 좋은 자리에서 뒹굴뒹굴했다. 기분 좋은 표정이 사진으로도 다 보일 것 같아.`,
  (name: string) =>
    `${withJosa(name, '이/가')} 이름을 부르니까 고개를 갸웃했다. 별거 아닌데 그 표정 때문에 오늘 하루가 더 좋아졌어.`,
  (name: string) =>
    `오늘은 ${withJosa(name, '이/가')} 산책 끝나고도 집 앞에서 더 놀고 싶은 눈치였다. 다음엔 조금 더 오래 놀아야겠다.`,
] as const

/** 태그 한글 레이블. snake_case key → 한국어 UI 표시. */
const TAG_LABELS: Record<LogTag, string> = {
  meal: '밥',
  walk: '산책',
  bathroom: '배변',
  play: '놀이',
  sleep: '잠',
  outing: '외출',
  bath: '목욕',
  snack: '간식',
}

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

function buildMemoPlaceholder(petName: string, index: number): string {
  const builder = MEMO_EXAMPLE_BUILDERS[index] ?? MEMO_EXAMPLE_BUILDERS[0]
  return `예시) ${builder(petName)}`
}

function pickMemoPlaceholder(petName: string, seed: string): string {
  let hash = 0
  for (const char of `${seed}:${petName}`) {
    hash = (hash * 31 + char.charCodeAt(0)) >>> 0
  }
  const index = hash % MEMO_EXAMPLE_BUILDERS.length
  return buildMemoPlaceholder(petName, index)
}

export function UploadForm({
  petId,
  petName,
  logDate,
  compact = false,
}: Props) {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [file, setFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [selectedTags, setSelectedTags] = useState<LogTag[]>([])
  const [memo, setMemo] = useState('')
  const [startedAt, setStartedAt] = useState<number | null>(null)
  const [completedDiary, setCompletedDiary] = useState<{
    id: string
    title: string
    imageUrl?: string | null
  } | null>(null)
  const memoPlaceholder = pickMemoPlaceholder(
    petName,
    logDate ?? todayInSeoul(),
  )
  const [isPending, startTransition] = useTransition()

  function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const picked = e.target.files?.[0] ?? null
    if (!picked) {
      setFile(null)
      if (previewUrl) URL.revokeObjectURL(previewUrl)
      setPreviewUrl(null)
      return
    }
    setFile(picked)
    if (previewUrl) URL.revokeObjectURL(previewUrl)
    setPreviewUrl(URL.createObjectURL(picked))
  }

  function toggleTag(tag: LogTag) {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag],
    )
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()

    const fd = new FormData()
    if (file) {
      // Client EXIF strip — server sharp 가드가 또 있지만 여기서 먼저 털어낸다.
      const cleaned = await stripExifClient(file)
      fd.set('photo', cleaned, 'photo.jpg')
    }
    fd.set('petId', petId)
    fd.set('logDate', logDate ?? todayInSeoul())
    fd.set('tags', JSON.stringify(selectedTags))
    fd.set('memo', memo)

    setStartedAt(Date.now())
    startTransition(async () => {
      const result = await createLog(fd)
      if (result.ok) {
        setCompletedDiary({
          id: result.diaryId,
          title: result.title,
          imageUrl: result.imageUrl,
        })
        window.setTimeout(() => {
          router.push(`/diary/${result.diaryId}?arrive=1`)
        }, 2800)
        return
      }
      setStartedAt(null)
      toast.error(result.error)
    })
  }

  return (
    <>
      <form onSubmit={onSubmit} className="flex flex-col gap-4">
        <div className="flex flex-col gap-2.5 rounded-[calc(var(--radius-card)+8px)] bg-[var(--color-paper)] p-2.5 shadow-[var(--shadow-soft)] ring-1 ring-[var(--color-line)]">
          <section className="rounded-[var(--radius-card)] bg-[var(--color-bg)] p-4 ring-1 ring-[var(--color-line)]">
            <h3 className="text-left text-[15px] font-semibold text-[var(--color-ink)]">
              오늘은 어떤 하루였어?
            </h3>
            <div className="mt-4 grid grid-cols-4 gap-2">
              {LOG_TAG_VALUES.map((tag) => {
                const active = selectedTags.includes(tag)
                return (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => toggleTag(tag)}
                    aria-pressed={active}
                    className={cn(
                      'flex min-h-12 items-center justify-center px-2 text-[13px] font-medium transition-colors',
                      'ring-1 ring-[var(--color-line)]',
                      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent-brand)] focus-visible:ring-offset-2',
                      active
                        ? 'bg-[var(--color-accent-brand-soft)] text-[var(--color-ink)] ring-[var(--color-accent-brand)]'
                        : 'bg-[var(--color-paper)] text-[var(--color-ink-soft)] hover:bg-[var(--color-accent-brand-soft)]',
                    )}
                    style={{
                      borderRadius: 'var(--radius-pill)',
                      fontFamily: 'var(--font-sans)',
                    }}
                  >
                    {TAG_LABELS[tag]}
                  </button>
                )
              })}
            </div>
          </section>

          <section className="rounded-[var(--radius-card)] bg-[var(--color-bg)] p-4 ring-1 ring-[var(--color-line)]">
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-[15px] font-semibold text-[var(--color-ink)]">
                버디노트
              </h3>
              <span
                id="memo-count"
                aria-live="polite"
                className="text-[11px] text-[var(--color-mute)]"
                style={{ fontFamily: 'var(--font-sans)' }}
              >
                {memo.length} / {MAX_MEMO}
              </span>
            </div>
            <Label htmlFor="memo-input" className="sr-only">
              버디노트에 남길 이야기 (선택)
            </Label>
            <div className="mt-3 rounded-[var(--radius-input)] bg-[var(--color-paper)] px-3 py-2">
              <textarea
                id="memo-input"
                name="memo"
                value={memo}
                onChange={(e) => setMemo(e.target.value.slice(0, MAX_MEMO))}
                maxLength={MAX_MEMO}
                rows={3}
                aria-describedby="memo-count"
                placeholder={memoPlaceholder}
                className={cn(
                  'w-full resize-none bg-transparent text-[14px] leading-[1.55]',
                  'text-[var(--color-ink)] placeholder:text-[var(--color-mute)]',
                  'focus:outline-none',
                )}
                style={{ fontFamily: 'var(--font-sans)' }}
              />
            </div>
          </section>

          {/* 사진 업로드 — 폴라로이드 드롭존 */}
          <section className="rounded-[var(--radius-card)] bg-[var(--color-bg)] p-4 ring-1 ring-[var(--color-line)]">
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-[15px] font-semibold text-[var(--color-ink)]">
                오늘의 사진
              </h3>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                aria-label="사진 선택하기"
                className="flex h-9 w-9 items-center justify-center rounded-[var(--radius-pill)] text-[var(--color-mute)] transition-colors hover:bg-[var(--color-paper)] hover:text-[var(--color-ink)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent-brand)]"
              >
                <Plus className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>
            <Label htmlFor="photo-input" className="sr-only">
              오늘의 사진
            </Label>
            <input
              id="photo-input"
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              aria-describedby="photo-input-hint"
              className="sr-only"
              onChange={onFileChange}
            />
            <button
              type="button"
              aria-describedby="photo-input-hint"
              onClick={() => fileInputRef.current?.click()}
              className={cn(
                'mt-3 block w-full cursor-pointer overflow-hidden text-center',
                'bg-[var(--color-paper)] ring-1 ring-[var(--color-line)]',
                'motion-safe:transition-colors motion-safe:duration-[var(--duration-default)] motion-safe:ease-[var(--ease-soft-out)]',
                !compact ? 'hover:bg-[var(--color-accent-brand-soft)]' : '',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent-brand)] focus-visible:ring-offset-2',
              )}
              style={{ borderRadius: 'var(--radius-input)' }}
            >
              {previewUrl ? (
                <div className="relative aspect-[4/3] w-full overflow-hidden bg-[var(--color-bg)]">
                  {/* 프리뷰는 user-selected blob — Next Image 대상 아님 */}
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={previewUrl}
                    alt={`${petName}의 오늘 사진 미리보기`}
                    className="h-full w-full object-cover"
                  />
                </div>
              ) : (
                <div
                  className={cn(
                    'flex aspect-[4/3] w-full flex-col items-center justify-center gap-2',
                    'bg-[var(--color-bg)] text-[var(--color-mute)]',
                  )}
                >
                  <span className="flex h-12 w-12 items-center justify-center rounded-[var(--radius-pill)] bg-[var(--color-paper)] ring-1 ring-[var(--color-line)]">
                    <Camera className="h-6 w-6" aria-hidden="true" />
                  </span>
                  <span
                    className="text-[13px]"
                    style={{ fontFamily: 'var(--font-sans)' }}
                  >
                    사진을 골라주세요
                  </span>
                  <span
                    className="text-[11px]"
                    style={{ fontFamily: 'var(--font-sans)' }}
                  >
                    JPG · PNG · WebP · 8MB 이하
                  </span>
                </div>
              )}
              <p
                id="photo-input-hint"
                className="px-3 py-2 text-center text-[12px] text-[var(--color-mute)]"
                style={{ fontFamily: 'var(--font-sans)' }}
              >
                {file ? '이 사진으로 남길게요' : '눌러서 선택하기'}
              </p>
            </button>
          </section>
        </div>

        <Button
          type="submit"
          size="lg"
          disabled={isPending}
          aria-busy={isPending}
          className="h-12 w-full text-[15px]"
        >
          {isPending ? '일기를 만드는 중...' : `${petName}의 일기 만들기`}
        </Button>
      </form>

      {/* 진행 오버레이 — pending일 때만 */}
      {isPending ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="일기 생성 진행 중"
          className={cn(
            'fixed inset-0 z-50 flex items-center justify-center px-4',
            'bg-[var(--color-bg)]/85 backdrop-blur-sm',
          )}
        >
          <PhaseCopy
            petName={petName}
            startedAt={startedAt ?? undefined}
            onCancel={() => router.back()}
          />
        </div>
      ) : null}

      {completedDiary ? (
        <ShutterReveal
          title={completedDiary.title}
          petName={petName}
          imageUrl={completedDiary.imageUrl}
        />
      ) : null}
    </>
  )
}
