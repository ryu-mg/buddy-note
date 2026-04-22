import { Skeleton } from '@/components/ui/skeleton'

/**
 * `/diary/[id]` RSC suspense fallback.
 *
 * `app/diary/[id]/page.tsx`의 layout을 echo:
 *  - 상단 뒤로가기 / diary 라벨 라인
 *  - 폴라로이드 hero: 날짜 + 이름 → 4:5 사진 → 제목 → 본문(명조체, 4줄)
 *  - 공유 버튼 row
 *
 * 기울임 `-1.2deg` (DESIGN §12).
 */
export default function DiaryLoading() {
  return (
    <main
      role="status"
      aria-label="불러오는 중"
      aria-live="polite"
      aria-busy="true"
      className="mx-auto flex min-h-screen w-full max-w-xl flex-col gap-8 px-4 pb-16 pt-8"
    >
      {/* 상단 바 */}
      <header className="flex items-center justify-between">
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-3 w-12" />
      </header>

      {/* Hero 폴라로이드 */}
      <article
        aria-hidden="true"
        className="relative mx-auto w-full max-w-[420px] bg-[var(--color-paper)] px-6 pb-11 pt-6 shadow-[var(--shadow-card)] ring-1 ring-[var(--color-line)] motion-safe:-rotate-[1.2deg] motion-reduce:rotate-0"
      >
        {/* 상단 메타 — 좌 날짜, 우 이름 */}
        <div className="flex items-baseline justify-between gap-3">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-4 w-14" />
        </div>

        {/* 사진 4:5 */}
        <div className="mt-4 overflow-hidden bg-[var(--color-line)]">
          <div className="relative aspect-[4/5] w-full">
            <Skeleton className="absolute inset-0 h-full w-full rounded-none" />
          </div>
        </div>

        {/* 제목 (h1 26px/1.3) */}
        <Skeleton className="mt-6 h-7 w-4/5" />

        {/* 본문 4줄 (명조체 18px/1.7 감각 — 줄 간격 ~12px) */}
        <div className="mt-4 flex flex-col gap-3">
          <Skeleton className="h-5 w-full" />
          <Skeleton className="h-5 w-full" />
          <Skeleton className="h-5 w-11/12" />
          <Skeleton className="h-5 w-3/4" />
        </div>
      </article>

      {/* 공유 버튼 row */}
      <section className="mx-auto flex w-full max-w-[420px] flex-col gap-3">
        <Skeleton
          className="h-12 w-full"
          style={{ borderRadius: 'var(--radius-button)' }}
        />
      </section>
    </main>
  )
}
