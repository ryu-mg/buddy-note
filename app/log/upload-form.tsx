'use client'

import { useRef, useState, useTransition } from 'react'

import { useRouter } from 'next/navigation'
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
  companionRelationship?: string | null
}

const MAX_MEMO = 200

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

export function UploadForm({
  petId,
  petName,
  logDate,
  companionRelationship,
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
  const [isPending, startTransition] = useTransition()
  const companion = companionRelationship?.trim() || '엄마/아빠'

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
    if (!file) {
      toast.error('사진 한 장을 먼저 골라주세요.')
      return
    }

    // Client EXIF strip — server sharp 가드가 또 있지만 여기서 먼저 털어낸다.
    const cleaned = await stripExifClient(file)

    const fd = new FormData()
    fd.set('photo', cleaned, 'photo.jpg')
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
        }, 1400)
        return
      }
      setStartedAt(null)
      toast.error(result.error)
    })
  }

  return (
    <>
      <form onSubmit={onSubmit} className="flex flex-col gap-6">
        <section className="flex flex-col gap-3">
          <div>
            <p className="text-[12px] font-medium uppercase tracking-[0.14em] text-[var(--color-mute)]">
              1
            </p>
            <h3 className="text-[18px] font-semibold text-[var(--color-ink)]">
              오늘 뭐 했어?
            </h3>
          </div>
          <div className="flex flex-wrap gap-2">
            {LOG_TAG_VALUES.map((tag) => {
              const active = selectedTags.includes(tag)
              return (
                <button
                  key={tag}
                  type="button"
                  onClick={() => toggleTag(tag)}
                  aria-pressed={active}
                  className={cn(
                    'min-h-11 px-3 text-[13px] transition-colors',
                    'ring-1 ring-[var(--color-line)]',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent-brand)] focus-visible:ring-offset-2',
                    active
                      ? 'bg-[var(--color-accent-brand-soft)] text-[var(--color-ink)] ring-[var(--color-accent-brand)]'
                      : 'bg-[var(--color-bg)] text-[var(--color-ink-soft)] hover:bg-[var(--color-paper)]',
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

        {/* 사진 업로드 — 폴라로이드 드롭존 */}
        <section className="flex flex-col gap-2">
          <div>
            <p className="text-[12px] font-medium uppercase tracking-[0.14em] text-[var(--color-mute)]">
              2
            </p>
            <h3 className="text-[18px] font-semibold text-[var(--color-ink)]">
              사진 찍어둔 거 있어?
            </h3>
          </div>
          <Label
            htmlFor="photo-input"
            className="sr-only"
          >
            오늘의 사진
          </Label>
          <input
            id="photo-input"
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            aria-required="true"
            aria-describedby="photo-input-hint"
            className="sr-only"
            onChange={onFileChange}
          />
          <label
            htmlFor="photo-input"
            className={cn(
              'relative block cursor-pointer',
              'bg-[var(--color-paper)] p-6 pb-11',
              'ring-1 ring-[var(--color-line)]',
              'motion-safe:-rotate-[1.2deg] motion-safe:transition-transform',
              'motion-safe:duration-[var(--duration-default)] motion-safe:ease-[var(--ease-soft-out)]',
              'hover:motion-safe:rotate-0',
              'focus-within:ring-2 focus-within:ring-[var(--color-accent-brand)] focus-within:ring-offset-2',
            )}
            style={{ borderRadius: 'var(--radius-card)' }}
          >
            {previewUrl ? (
              <div className="relative aspect-[4/5] w-full overflow-hidden bg-[var(--color-bg)]">
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
                  'flex aspect-[4/5] w-full flex-col items-center justify-center gap-2',
                  'bg-[var(--color-bg)] text-[var(--color-mute)]',
                )}
              >
                <span
                  className="text-[15px]"
                  style={{ fontFamily: 'var(--font-sans)' }}
                >
                  사진 한 장을 올려주세요
                </span>
                <span
                  className="text-[12px]"
                  style={{ fontFamily: 'var(--font-sans)' }}
                >
                  JPG · PNG · WebP · 8MB 이하
                </span>
              </div>
            )}
            <p
            id="photo-input-hint"
            className="mt-3 text-center text-[12px] text-[var(--color-mute)]"
              style={{ fontFamily: 'var(--font-serif)' }}
            >
            {file ? '마음에 들면 아래 버튼을 눌러주세요' : '눌러서 고르기'}
          </p>
          </label>
        </section>

        {/* Memo — native textarea, 토큰 스타일 */}
        <section className="flex flex-col gap-2">
          <div>
            <p className="text-[12px] font-medium uppercase tracking-[0.14em] text-[var(--color-mute)]">
              3
            </p>
            <h3 className="text-[18px] font-semibold text-[var(--color-ink)]">
              {withJosa(companion, '이/가')} 뭐 말해줄 거 있어?
            </h3>
          </div>
          <Label
            htmlFor="memo-input"
            className="sr-only"
          >
            남겨두고 싶은 메모 (선택)
          </Label>
          <textarea
            id="memo-input"
            name="memo"
            value={memo}
            onChange={(e) => setMemo(e.target.value.slice(0, MAX_MEMO))}
            maxLength={MAX_MEMO}
            rows={3}
            aria-describedby="memo-count"
            placeholder="예) 오늘 처음 보는 길에서도 씩씩하게 걸었어"
            className={cn(
              'w-full resize-none px-3 py-2 text-[14px] leading-[1.55]',
              'bg-[var(--color-bg)] text-[var(--color-ink)]',
              'ring-1 ring-[var(--color-line)]',
              'placeholder:text-[var(--color-mute)]',
              'focus:outline-none focus:ring-2 focus:ring-[var(--color-accent-brand)] focus:ring-offset-0',
            )}
            style={{
              borderRadius: 'var(--radius-input)',
              fontFamily: 'var(--font-sans)',
            }}
          />
          <p
            id="memo-count"
            aria-live="polite"
            className="text-right text-[11px] text-[var(--color-mute)]"
            style={{ fontFamily: 'var(--font-sans)' }}
          >
            {memo.length} / {MAX_MEMO}
          </p>
        </section>

        <Button
          type="submit"
          size="lg"
          disabled={isPending || !file}
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
          imageUrl={completedDiary.imageUrl}
        />
      ) : null}
    </>
  )
}
