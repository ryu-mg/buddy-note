import { Skeleton } from '@/components/ui/skeleton'

export default function HomeLoading() {
  return (
    <main
      role="status"
      aria-label="불러오는 중"
      aria-live="polite"
      aria-busy="true"
      className="mx-auto flex min-h-screen w-full max-w-3xl flex-col gap-6 px-4 pb-28 pt-8 sm:px-6 md:pt-10"
    >
      <header className="flex flex-col gap-2">
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-7 w-56" />
        <Skeleton className="h-4 w-48" />
      </header>

      <section className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <Skeleton className="h-10 w-14" />
          <Skeleton className="h-7 w-28" />
          <Skeleton className="h-10 w-14" />
        </div>
        <div className="grid grid-cols-7 gap-1">
          {Array.from({ length: 49 }, (_, i) => (
            <Skeleton
              key={i}
              className={i < 7 ? 'h-8 rounded-[8px]' : 'aspect-square rounded-[8px]'}
            />
          ))}
        </div>
      </section>
    </main>
  )
}
