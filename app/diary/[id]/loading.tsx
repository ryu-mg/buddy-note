import { Skeleton } from '@/components/ui/skeleton'

/**
 * `/diary/[id]` RSC suspense fallback.
 *
 * `app/diary/[id]/page.tsx`의 layout을 echo:
 *  - 상단 뒤로가기 / diary 라벨 라인
 *  - 상세 카드: 날짜 + 제목 → 본문(명조체, 4줄) → 사진
 *  - 공유 버튼 row
 *
 * 일기 상세 카드는 화면 정렬을 위해 기울임 없이 렌더한다.
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

      {/* 상세 카드 */}
      <article
        aria-hidden="true"
        className="relative mx-auto w-full max-w-[420px] overflow-hidden rounded-[var(--radius-card)] border border-[var(--color-line)] bg-[var(--color-paper)] p-2 shadow-[var(--shadow-card)]"
      >
        {/* 제목 */}
        <div className="px-2 pb-5 pt-4">
          <Skeleton className="h-7 w-4/5" />

          {/* 본문 4줄 */}
          <div className="mt-4 flex flex-col gap-3">
            <Skeleton className="h-5 w-full" />
            <Skeleton className="h-5 w-full" />
            <Skeleton className="h-5 w-11/12" />
            <Skeleton className="h-5 w-3/4" />
          </div>
        </div>

        {/* 사진 */}
        <div className="mx-auto mb-2 w-full max-w-[320px] overflow-hidden rounded-[var(--radius-button)] bg-[var(--color-line)]">
          <div className="relative aspect-[4/5] w-full">
            <Skeleton className="absolute inset-0 h-full w-full rounded-none" />
          </div>
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
