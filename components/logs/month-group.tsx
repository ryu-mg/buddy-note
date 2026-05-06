import { DiaryCard } from '@/components/home/diary-card'

export type HistoryDiaryCard = {
  id: string
  title: string
  body: string
  imageUrl: string | null
  createdAt: string
}

type MonthGroupProps = {
  label: string
  count: number
  diaries: HistoryDiaryCard[]
}

export function MonthGroup({ label, count, diaries }: MonthGroupProps) {
  return (
    <section aria-labelledby={`month-${label}`} className="flex flex-col gap-5">
      <header className="flex items-baseline justify-between border-b border-[var(--color-line)] pb-3">
        <h2
          id={`month-${label}`}
          className="text-[18px] font-semibold leading-[1.35] text-[var(--color-ink)]"
        >
          {label}
        </h2>
        <p className="text-[12px] font-medium text-[var(--color-mute)]">
          기록 {count}개
        </p>
      </header>

      <div className="grid grid-cols-1 gap-8 sm:gap-10 md:grid-cols-2">
        {diaries.map((diary) => (
          <DiaryCard
            key={diary.id}
            id={diary.id}
            title={diary.title}
            body={diary.body}
            imageUrl={diary.imageUrl}
            createdAt={diary.createdAt}
          />
        ))}
      </div>
    </section>
  )
}
