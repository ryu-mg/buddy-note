import { DiaryCardSkeleton } from '@/components/skeleton/diary-card-skeleton'
import { Skeleton } from '@/components/ui/skeleton'

/**
 * `/b/[slug]` RSC suspense fallback (공개 프로필).
 *
 * `app/b/[slug]/page.tsx`의 hero + 피드 layout을 echo:
 *  - 상단 eyebrow + pet 이름(h1) + "N일째" 서브라인 (가운데 정렬)
 *  - 2-col 그리드로 `PublicDiaryCard` 형태의 skeleton 4장
 */
export default function PublicProfileLoading() {
  return (
    <main
      role="status"
      aria-label="불러오는 중"
      aria-live="polite"
      aria-busy="true"
      className="mx-auto flex min-h-screen w-full max-w-5xl flex-col gap-12 px-4 pb-16 pt-10 sm:px-6"
    >
      {/* Hero */}
      <header className="flex flex-col items-center gap-3 pt-6 text-center">
        <Skeleton className="h-3 w-24" />
        <Skeleton className="h-10 w-48 sm:h-12" />
        <Skeleton className="h-4 w-32" />
      </header>

      {/* 2-col grid */}
      <section
        aria-label="공개 일기 불러오는 중"
        className="grid grid-cols-1 gap-12 md:grid-cols-2 md:gap-x-10 md:gap-y-16"
      >
        {[0, 1, 2, 3].map((i) => (
          <DiaryCardSkeleton
            key={i}
            variant="public"
            tilt={i % 2 === 0 ? 'left' : 'right'}
          />
        ))}
      </section>
    </main>
  )
}
