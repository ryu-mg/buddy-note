import { Skeleton } from '@/components/ui/skeleton'

/**
 * `/log` RSC suspense fallback.
 *
 * `UploadForm` (client)의 layout을 그대로 echo 하여 렌더 직후 layout shift 없음:
 *  - 헤더 (상단 eyebrow + h1 + subline)
 *  - 폴라로이드 드롭존 (4:5, `-1.2deg`)
 *  - 태그 칩 6개 (pill)
 *  - 메모 textarea (3줄)
 *  - 제출 버튼
 */
export default function LogLoading() {
  return (
    <main
      role="status"
      aria-label="불러오는 중"
      aria-live="polite"
      aria-busy="true"
      className="mx-auto flex w-full max-w-md flex-col gap-6 px-4 py-10"
    >
      {/* 헤더 */}
      <header className="flex flex-col gap-1">
        <Skeleton className="h-3 w-24" />
        <Skeleton className="mt-1 h-6 w-56" />
        <Skeleton className="mt-2 h-4 w-64" />
      </header>

      <div className="flex flex-col gap-6">
        {/* 폴라로이드 드롭존 */}
        <div className="flex flex-col gap-2">
          <Skeleton className="h-3 w-20" />
          <div
            className="relative block bg-[var(--color-paper)] p-6 pb-11 ring-1 ring-[var(--color-line)] motion-safe:-rotate-[1.2deg] motion-reduce:rotate-0"
            style={{ borderRadius: 'var(--radius-card)' }}
          >
            <div className="relative aspect-[4/5] w-full overflow-hidden bg-[var(--color-bg)]">
              <Skeleton className="absolute inset-0 h-full w-full rounded-none" />
            </div>
            <Skeleton className="mx-auto mt-3 h-3 w-32" />
          </div>
        </div>

        {/* 태그 chips row */}
        <div className="flex flex-col gap-2">
          <Skeleton className="h-3 w-24" />
          <div className="flex flex-wrap gap-2">
            {[14, 16, 14, 16, 14, 18, 14, 16].map((w, i) => (
              <Skeleton
                key={i}
                className="h-11"
                style={{
                  width: `${w * 4}px`,
                  borderRadius: 'var(--radius-pill)',
                }}
              />
            ))}
          </div>
        </div>

        {/* Memo textarea (3줄) */}
        <div className="flex flex-col gap-2">
          <Skeleton className="h-3 w-32" />
          <Skeleton
            className="h-[78px] w-full"
            style={{ borderRadius: 'var(--radius-input)' }}
          />
          <div className="flex justify-end">
            <Skeleton className="h-3 w-12" />
          </div>
        </div>

        {/* Submit 버튼 (disabled 느낌) */}
        <Skeleton
          className="h-12 w-full opacity-70"
          style={{ borderRadius: 'var(--radius-button)' }}
        />
      </div>
    </main>
  )
}
