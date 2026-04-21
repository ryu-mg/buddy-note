'use client'

type ProgressProps = {
  /** 1-based 현재 step (1..total) */
  current: number
  /** 총 step 개수 */
  total: number
}

export function Progress({ current, total }: ProgressProps) {
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
