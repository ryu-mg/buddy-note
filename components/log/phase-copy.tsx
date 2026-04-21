'use client'

import { useEffect, useMemo, useState } from 'react'

import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'

type Props = {
  /** 강아지 이름. 예: "콩이" */
  petName: string
  /** optional — phase 2 이후 은은하게 "뒤로 갈래요" 링크 노출 */
  onCancel?: () => void
  /** submit 시각 (ms). 없으면 mount 시점 기준 */
  startedAt?: number
}

/** 4단계 경계 (ms). `architecture.md` 기준 25~45s 사이 변동 */
const PHASE_BOUNDARIES_MS = [0, 5_000, 15_000, 25_000] as const
/** 35초 이후 "AI가 조금 더 생각하고 있어요" 안심 문구 */
const REASSURANCE_AT_MS = 35_000
/** 총 progress bar 기준선 — phase 4 도입 지점을 100%로 치환 */
const PROGRESS_CEILING_MS = 25_000

type PhaseIndex = 0 | 1 | 2 | 3

function pickPhase(elapsed: number): PhaseIndex {
  if (elapsed >= PHASE_BOUNDARIES_MS[3]) return 3
  if (elapsed >= PHASE_BOUNDARIES_MS[2]) return 2
  if (elapsed >= PHASE_BOUNDARIES_MS[1]) return 1
  return 0
}

type PhaseContent = {
  title: string
  body: string
}

function buildPhases(petName: string): readonly [PhaseContent, PhaseContent, PhaseContent, PhaseContent] {
  return [
    {
      title: '사진을 살펴보는 중이에요',
      body: `${petName}가 오늘 뭘 했는지 천천히 읽는 중이에요.`,
    },
    {
      title: '오늘의 순간을 찾는 중이에요',
      body: '눈에 띄는 장면을 하나씩 모아볼게요.',
    },
    {
      title: `${petName}의 말투로 적는 중이에요`,
      body: '평소 성격을 떠올리며 한 줄씩 적어볼게요.',
    },
    {
      title: '거의 다 됐어요',
      body: '마지막 다듬기만 남았어요.',
    },
  ] as const
}

export function PhaseCopy({ petName, onCancel, startedAt }: Props) {
  const [anchorAt] = useState(() => startedAt ?? Date.now())
  const [elapsed, setElapsed] = useState(0)

  // 500ms tick — phase 전환 + reassurance 트리거. unmount 시 cleanup.
  useEffect(() => {
    const id = window.setInterval(() => {
      setElapsed(Math.max(0, Date.now() - anchorAt))
    }, 500)
    return () => {
      window.clearInterval(id)
    }
  }, [anchorAt])

  const phases = useMemo(() => buildPhases(petName), [petName])
  const phaseIndex = pickPhase(elapsed)
  const phase = phases[phaseIndex]
  const showCancel = Boolean(onCancel) && phaseIndex >= 2
  const showReassurance = elapsed >= REASSURANCE_AT_MS

  const progressPct = Math.min(100, Math.round((elapsed / PROGRESS_CEILING_MS) * 100))

  return (
    <section
      aria-label="일기 생성 진행 상태"
      className="mx-auto w-full max-w-md"
    >
      <article
        className={cn(
          'relative px-6 pb-8 pt-6',
          'bg-[var(--color-paper)] ring-1 ring-[var(--color-line)]',
          'motion-safe:-rotate-[0.6deg] motion-safe:transition-transform',
          'motion-safe:duration-[var(--duration-default)] motion-safe:ease-[var(--ease-soft-out)]',
        )}
        style={{ borderRadius: 'var(--radius-card)' }}
      >
        {/* phase 별 시각 요소 */}
        <div
          className={cn(
            'transition-opacity motion-reduce:transition-none',
            'duration-200 ease-[var(--ease-soft-out)]',
          )}
          key={`visual-${phaseIndex}`}
        >
          {phaseIndex === 0 && <PhotoScanVisual />}
          {phaseIndex === 1 && <FeatureChipsVisual />}
          {phaseIndex === 2 && <PolaroidDraftVisual />}
          {phaseIndex === 3 && <PolaroidShimmerVisual />}
        </div>

        {/* phase title + body — aria-live polite로 교체 시 스크린리더 알림 */}
        <div
          aria-live="polite"
          aria-atomic="true"
          className="mt-5"
          key={`text-${phaseIndex}`}
        >
          <h2
            className={cn(
              'text-[16px] font-medium leading-[1.35] text-[var(--color-ink)]',
              'motion-safe:animate-in motion-safe:fade-in motion-safe:duration-200',
            )}
            style={{ fontFamily: 'var(--font-sans)' }}
          >
            {phase.title}
          </h2>
          <p
            className={cn(
              'mt-1.5 text-[14px] leading-[1.5] text-[var(--color-ink)]/70',
              'motion-safe:animate-in motion-safe:fade-in motion-safe:duration-200',
            )}
            style={{ fontFamily: 'var(--font-sans)' }}
          >
            {phase.body}
          </p>
        </div>

        {/* progress bar — 25s까지 linear, 이후 100% 고정 */}
        <div
          role="progressbar"
          aria-valuenow={progressPct}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label="일기 생성 진행률"
          className="mt-5 h-[3px] w-full overflow-hidden rounded-full bg-[var(--color-line)]"
        >
          <div
            className="h-full rounded-full bg-[var(--color-accent-brand)] transition-[width] duration-500 ease-[var(--ease-soft-out)] motion-reduce:transition-none"
            style={{ width: `${progressPct}%` }}
          />
        </div>

        {/* 35s+ 안심 문구 */}
        {showReassurance ? (
          <p
            aria-live="polite"
            className={cn(
              'mt-4 text-[12px] leading-[1.5] text-[var(--color-mute)]',
              'motion-safe:animate-in motion-safe:fade-in motion-safe:duration-200',
            )}
          >
            AI가 조금 더 생각하고 있어요. 30초 안에 보여드릴게요.
          </p>
        ) : null}

        {/* 취소 링크 — phase 2+에서만, 은은하게 */}
        {showCancel ? (
          <div className="mt-5 flex justify-center">
            <button
              type="button"
              onClick={onCancel}
              className={cn(
                'text-[12px] text-[var(--color-mute)]',
                'underline-offset-4 hover:underline hover:text-[var(--color-ink-soft)]',
                'focus-visible:outline-none focus-visible:underline',
                'transition-colors motion-reduce:transition-none',
              )}
            >
              뒤로 갈래요
            </button>
          </div>
        ) : null}
      </article>
    </section>
  )
}

/* ---------------------------------------------------------------------------
 * Phase 0 — 사진 preview placeholder (1:1 크롭 폴라로이드 스펙 따라감)
 * ------------------------------------------------------------------------- */
function PhotoScanVisual() {
  return (
    <div className="relative aspect-square w-full overflow-hidden bg-[var(--color-bg)] ring-1 ring-[var(--color-line)]">
      <Skeleton className="absolute inset-0 h-full w-full rounded-none bg-[var(--color-line)]/60" />
    </div>
  )
}

/* ---------------------------------------------------------------------------
 * Phase 1 — 인식된 특징 칩 3개 (faint pill)
 * ------------------------------------------------------------------------- */
function FeatureChipsVisual() {
  return (
    <div className="flex flex-wrap gap-2 py-3">
      <Skeleton className="h-7 w-20 rounded-[var(--radius-pill)] bg-[var(--color-line)]/70" />
      <Skeleton className="h-7 w-24 rounded-[var(--radius-pill)] bg-[var(--color-line)]/55" />
      <Skeleton className="h-7 w-16 rounded-[var(--radius-pill)] bg-[var(--color-line)]/45" />
    </div>
  )
}

/* ---------------------------------------------------------------------------
 * Phase 2 — 폴라로이드 초안 카드 (serif body line skeletons)
 * ------------------------------------------------------------------------- */
function PolaroidDraftVisual() {
  return (
    <div
      className="bg-[var(--color-bg)] p-4 ring-1 ring-[var(--color-line)]"
      style={{ borderRadius: 'var(--radius-card)' }}
    >
      <div className="space-y-2" style={{ fontFamily: 'var(--font-serif)' }}>
        <Skeleton className="h-[14px] w-[88%] rounded-sm bg-[var(--color-line)]/70" />
        <Skeleton className="h-[14px] w-[72%] rounded-sm bg-[var(--color-line)]/60" />
        <Skeleton className="h-[14px] w-[80%] rounded-sm bg-[var(--color-line)]/60" />
        <Skeleton className="h-[14px] w-[58%] rounded-sm bg-[var(--color-line)]/50" />
      </div>
    </div>
  )
}

/* ---------------------------------------------------------------------------
 * Phase 3 — 폴라로이드 shimmer (Tailwind animate-pulse 위에 opacity 강조)
 * ------------------------------------------------------------------------- */
function PolaroidShimmerVisual() {
  return (
    <div
      className={cn(
        'relative overflow-hidden bg-[var(--color-bg)] p-4 ring-1 ring-[var(--color-line)]',
        'motion-safe:animate-pulse',
      )}
      style={{ borderRadius: 'var(--radius-card)' }}
    >
      <div className="space-y-2" style={{ fontFamily: 'var(--font-serif)' }}>
        <Skeleton className="h-[14px] w-[92%] rounded-sm bg-[var(--color-line)]/70" />
        <Skeleton className="h-[14px] w-[78%] rounded-sm bg-[var(--color-line)]/65" />
        <Skeleton className="h-[14px] w-[85%] rounded-sm bg-[var(--color-line)]/60" />
        <Skeleton className="h-[14px] w-[66%] rounded-sm bg-[var(--color-line)]/55" />
      </div>
      {/* accent glow — 마지막 단계 "거의 다 됐다" 감각 */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-0 h-[2px] bg-[var(--color-accent-brand)]/50"
      />
    </div>
  )
}
