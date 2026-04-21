import { DiaryCardSkeleton } from '@/components/skeleton/diary-card-skeleton'

export default function LogsLoading() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-5xl flex-col gap-8 px-4 pb-20 pt-8 sm:px-6 md:gap-10 md:pt-10">
      <header className="flex flex-col gap-2">
        <div className="h-7 w-40 rounded-[8px] bg-[var(--color-line)]" />
        <div className="h-4 w-64 rounded-[8px] bg-[var(--color-line)]" />
      </header>

      <section className="flex flex-col gap-5">
        <div className="h-6 w-28 rounded-[8px] bg-[var(--color-line)]" />
        <div className="grid grid-cols-1 gap-8 sm:gap-10 md:grid-cols-2">
          <DiaryCardSkeleton tilt="left" />
          <DiaryCardSkeleton tilt="right" />
        </div>
      </section>
    </main>
  )
}
