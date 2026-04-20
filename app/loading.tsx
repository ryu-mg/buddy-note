import { DiaryCardSkeleton } from '@/components/skeleton/diary-card-skeleton'
import { Skeleton } from '@/components/ui/skeleton'

/**
 * 홈(`/`) RSC suspense fallback.
 *
 * 실제 `app/page.tsx`의 authenticated layout을 echo:
 *  - 헤더 (pet name + "N일째" 서브라인)
 *  - "일기 쓰기" CTA 카드 (테라코타 accent placeholder)
 *  - 2-col 그리드의 diary 카드 4장 (tilt 교차)
 *
 * 익명 랜딩에는 접근하지 않으므로 authenticated path만 대응. (Next 16 기본 동작)
 */
export default function HomeLoading() {
  return (
    <main
      role="status"
      aria-label="불러오는 중"
      aria-live="polite"
      aria-busy="true"
      className="mx-auto flex min-h-screen w-full max-w-5xl flex-col gap-8 px-4 pb-20 pt-8 sm:px-6 md:gap-10 md:pt-10"
    >
      {/* Header — pet 이름 + N일째 서브라인 */}
      <header className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div className="flex flex-col gap-2">
          <Skeleton className="h-6 w-56 md:h-7" />
          <Skeleton className="h-4 w-40" />
        </div>
        <Skeleton className="h-9 w-28" />
      </header>

      {/* "일기 쓰기" CTA 카드 — 테라코타 accent placeholder */}
      <div
        className="group/cta relative mx-auto block w-full max-w-[520px] motion-safe:[transform:rotate(-1.2deg)] motion-reduce:rotate-0"
      >
        <div className="bg-[var(--color-paper)] px-7 py-7 shadow-[0_1px_2px_rgba(0,0,0,0.04),0_14px_32px_-18px_rgba(0,0,0,0.18)] ring-1 ring-[var(--color-line)]">
          <Skeleton className="h-3 w-20" />
          <Skeleton className="mt-3 h-6 w-3/4" />
          <Skeleton className="mt-2 h-4 w-2/3" />
          {/* 테라코타 tint로 accent CTA 영역 placeholder */}
          <Skeleton className="mt-5 h-10 w-40 rounded-[10px] bg-[var(--color-accent-brand-soft)]" />
        </div>
      </div>

      {/* 2-col diary grid — 4장, tilt 교차 */}
      <section
        aria-label="일기 피드 불러오는 중"
        className="grid grid-cols-1 gap-8 sm:gap-10 md:grid-cols-2"
      >
        {[0, 1, 2, 3].map((i) => (
          <DiaryCardSkeleton
            key={i}
            variant="feed"
            tilt={i % 2 === 0 ? 'left' : 'right'}
          />
        ))}
      </section>
    </main>
  )
}
