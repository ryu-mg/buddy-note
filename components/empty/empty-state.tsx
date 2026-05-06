import Link from 'next/link'

import { BuddyHappy } from '@/components/illustrations/buddy-happy'
import { BuddyResting } from '@/components/illustrations/buddy-resting'
import { BuddyTilted } from '@/components/illustrations/buddy-tilted'
import { cn } from '@/lib/utils'

/**
 * 재사용 가능한 조용한 empty state.
 *
 * DESIGN §12 폴라로이드 스피릿: -0.6deg 살짝 기울임, 24px 안쪽 여백, paper bg.
 * empty는 시끄럽지 않아야 하므로 CTA는 text-link 스타일 (큰 버튼 X).
 * `tone='warm'`이면 제목 옆에 8px 테라코타 dot 하나 — diary 페이지의 warmth와 echo.
 *
 * 사용처:
 * - 향후 feed / tag filter / search 결과 비었을 때
 *
 * 참고: 홈의 "첫 일기 써보기" 폴라로이드는 의도적으로 큰 CTA (passive empty 아님) —
 * 이 컴포넌트로 교체하지 않음.
 */

type EmptyStateProps = {
  title: string
  hint?: string
  cta?: { label: string; href: string } | null
  tone?: 'neutral' | 'warm'
  illustration?: 'resting' | 'tilted' | 'happy' | 'none'
}

export function EmptyState({
  title,
  hint,
  cta,
  tone = 'neutral',
  illustration = 'none',
}: EmptyStateProps) {
  const Illustration =
    illustration === 'resting'
      ? BuddyResting
      : illustration === 'tilted'
        ? BuddyTilted
        : illustration === 'happy'
          ? BuddyHappy
          : null

  return (
    <section
      aria-label={title}
      className="mx-auto flex w-full max-w-[360px] flex-col items-center px-2 py-6"
    >
      <div
        className={cn(
          'w-full bg-[var(--color-paper)] px-6 py-6',
          'ring-1 ring-[var(--color-line)]',
          'shadow-[var(--shadow-card)]',
          'motion-safe:-rotate-[0.6deg] motion-reduce:rotate-0',
        )}
      >
        {Illustration ? (
          <Illustration className="mx-auto mb-4 h-24 w-32 text-[var(--color-ink)]" />
        ) : null}

        <div className="flex items-center justify-center gap-2">
          {tone === 'warm' ? (
            <span
              aria-hidden="true"
              className="inline-block h-2 w-2 rounded-[var(--radius-pill)] bg-[var(--color-accent-brand)]"
            />
          ) : null}
          <h2 className="text-[17px] font-semibold leading-[1.4] text-[var(--color-ink)] sm:text-[18px]">
            {title}
          </h2>
        </div>

        {hint ? (
          <p
            className="mt-3 text-center text-[14px] leading-[1.65] text-[var(--color-ink-soft)] opacity-70 sm:text-[15px]"
            style={{ fontFamily: 'var(--font-serif)' }}
          >
            {hint}
          </p>
        ) : null}

        {cta ? (
          <div className="mt-5 flex justify-center">
            <Link
              href={cta.href}
              className="text-[13px] font-medium text-[var(--color-ink-soft)] underline-offset-4 transition-opacity duration-200 hover:underline hover:opacity-90"
            >
              {cta.label}
            </Link>
          </div>
        ) : null}
      </div>
    </section>
  )
}
