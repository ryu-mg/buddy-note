'use client'

type MbtiAnswerSlot = { key: 'A' | 'B' } | null

type ProgressProps = {
  /** 1-based 현재 step (1..total) */
  current: number
  /** 총 step 개수 */
  total: number
  /**
   * MBTI 질문 슬롯 모드.
   * 제공되면 mini-polaroid deck을 렌더. 없으면 기존 progress bar.
   */
  mbtiSlots?: {
    /** 현재 MBTI 질문 (1-based, 1..total) */
    current: number
    /** 각 질문 답변 (null = 미답변) */
    answers: Array<MbtiAnswerSlot>
  }
}

const TILTS = [
  '-rotate-[3deg]',
  'rotate-[2deg]',
  '-rotate-[2deg]',
  'rotate-[4deg]',
  '-rotate-[1deg]',
]

export function Progress({ current, total, mbtiSlots }: ProgressProps) {
  // MBTI 슬롯 모드
  if (mbtiSlots) {
    return (
      <div
        className="flex items-center justify-center gap-3 py-5"
        role="progressbar"
        aria-valuenow={mbtiSlots.current}
        aria-valuemin={1}
        aria-valuemax={mbtiSlots.answers.length}
        aria-label={`질문 ${mbtiSlots.current} / ${mbtiSlots.answers.length}`}
      >
        {mbtiSlots.answers.map((ans, i) => {
          const idx = i + 1
          const isCurrent = idx === mbtiSlots.current
          const tilt = TILTS[i % TILTS.length]
          return (
            <div
              key={i}
              className={[
                'relative h-14 w-11 bg-[var(--color-paper)] p-1 pb-4 shadow-[var(--shadow-card-soft)] ring-1 transition-all duration-200',
                ans
                  ? 'ring-[var(--color-accent-brand)]'
                  : 'ring-[var(--color-line)]/60',
                isCurrent
                  ? 'scale-110 shadow-[var(--shadow-polaroid)] ring-2 ring-[var(--color-accent-brand)]'
                  : '',
                `motion-safe:${tilt} motion-reduce:rotate-0`,
              ].join(' ')}
              aria-current={isCurrent ? 'step' : undefined}
            >
              <span
                className={[
                  'flex h-full w-full items-center justify-center text-[11px] font-bold',
                  ans
                    ? 'bg-[var(--color-accent-brand-soft)] text-[var(--color-accent-brand)]'
                    : 'bg-[var(--color-bg)] text-[var(--color-line)]',
                ].join(' ')}
              >
                {ans ? ans.key : idx}
              </span>
              {ans ? (
                <span className="absolute bottom-1 left-0 right-0 text-center text-[8px] font-semibold uppercase tracking-[0.08em] text-[var(--color-accent-brand)]">
                  done
                </span>
              ) : (
                <span className="absolute bottom-1 left-0 right-0 text-center text-[8px] font-semibold uppercase tracking-[0.08em] text-[var(--color-mute)]">
                  {idx}
                </span>
              )}
            </div>
          )
        })}
      </div>
    )
  }

  // 기본 progress bar 모드
  const clamped = Math.min(Math.max(current, 1), total)
  const pct = Math.round((clamped / total) * 100)

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-baseline justify-between">
        <span className="text-xs font-semibold tracking-wide text-[var(--color-ink-soft)]">
          {clamped} / {total}
        </span>
        <span className="text-[11px] font-semibold text-[var(--color-accent-brand)]">
          {pct}%
        </span>
      </div>
      <div
        role="progressbar"
        aria-valuenow={clamped}
        aria-valuemin={1}
        aria-valuemax={total}
        aria-label="온보딩 진행률"
        className="h-[5px] w-full overflow-hidden rounded-full bg-[var(--color-line)]"
      >
        <div
          className="h-full rounded-full bg-[var(--color-accent-brand)] shadow-[0_0_0_1px_var(--color-accent-brand)] transition-[width] duration-300 ease-out motion-reduce:transition-none"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}
