import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'

type DiaryCardSkeletonProps = {
  /** 좌/우 기울임 변주 (DESIGN §12). */
  tilt?: 'left' | 'right'
  /**
   * 레이아웃 변형:
   *  - `feed`: 홈 피드 `DiaryCard` — 본문 하단에 날짜 메타.
   *  - `public`: 공개 프로필 `PublicDiaryCard` — 상단에 날짜/이름 라인.
   */
  variant?: 'feed' | 'public'
}

/**
 * 폴라로이드 스타일 diary card skeleton.
 *
 * 홈(`app/loading.tsx`)과 공개 프로필(`app/b/[slug]/loading.tsx`)에서 공유.
 * 실제 `DiaryCard` / `PublicDiaryCard`의 4:5 사진 영역 + title + body 2줄
 * 레이아웃을 그대로 echo 하여 렌더 완료 시 layout shift를 최소화한다.
 *
 * 텍스트는 전혀 없음 — shimmer + shape으로 "불러오는 중" 의미 전달.
 */
export function DiaryCardSkeleton({
  tilt = 'left',
  variant = 'feed',
}: DiaryCardSkeletonProps) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        'relative mx-auto w-full max-w-[420px]',
        'bg-[var(--color-paper)] p-6 pb-11',
        'shadow-[0_1px_2px_rgba(0,0,0,0.04),0_12px_28px_-16px_rgba(0,0,0,0.18)]',
        'ring-1 ring-[var(--color-line)]',
        'motion-reduce:rotate-0',
        tilt === 'left'
          ? 'motion-safe:-rotate-[1.2deg]'
          : 'motion-safe:rotate-[0.8deg]',
      )}
    >
      {variant === 'public' ? (
        // 상단 메타 라인 — 좌측 날짜, 우측 이름
        <div className="flex items-baseline justify-between gap-3">
          <Skeleton className="h-3 w-20" />
          <Skeleton className="h-3.5 w-14" />
        </div>
      ) : null}

      {/* 4:5 사진 영역 */}
      <div
        className={cn(
          'relative aspect-[4/5] w-full overflow-hidden bg-[var(--color-line)]',
          variant === 'public' ? 'mt-4' : '',
        )}
      >
        <Skeleton className="absolute inset-0 h-full w-full rounded-none" />
      </div>

      {/* 제목 한 줄 */}
      <Skeleton
        className={cn(
          'h-5',
          variant === 'public' ? 'mt-6 w-3/4' : 'mt-5 w-2/3',
        )}
      />

      {/* 본문 두 줄 — 명조체 line-height (~1.65) 감각으로 간격 */}
      <div className="mt-3 flex flex-col gap-2">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-5/6" />
      </div>

      {variant === 'feed' ? (
        // 하단 날짜 메타
        <Skeleton className="mt-4 h-3 w-16" />
      ) : null}
    </div>
  )
}
