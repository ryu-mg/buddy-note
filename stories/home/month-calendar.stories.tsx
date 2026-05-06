import type { Meta, StoryObj } from '@storybook/nextjs-vite'

import { PawPrint } from '@/components/icons/paw-print'
import { MOOD_CSS_VAR } from '@/lib/mood'
import type { DiaryMood } from '@/types/database'

function MonthCalendarPreview() {
  const days = Array.from({ length: 35 }, (_, i) => i + 1)
  const marked = new Map<number, DiaryMood>([
    [5, 'curious'],
    [12, 'calm'],
    [21, 'bright'],
  ] as const)

  return (
    <main className="mx-auto flex w-full max-w-md flex-col gap-5 bg-[var(--color-bg)] p-6">
      <header>
        <h1 className="text-[24px] font-semibold text-[var(--color-ink)]">
          마루의 한 달
        </h1>
      </header>
      <section className="grid grid-cols-7 gap-1 text-center">
        {['일', '월', '화', '수', '목', '금', '토'].map((day) => (
          <div key={day} className="py-2 text-[12px] text-[var(--color-mute)]">
            {day}
          </div>
        ))}
        {days.map((day) => {
          const mood = marked.get(day)
          return (
            <button
              key={day}
              type="button"
              className="flex aspect-square flex-col items-center justify-center rounded-[var(--radius-input)] border border-[var(--color-line)] bg-[var(--color-bg)] text-[14px] text-[var(--color-ink)]"
            >
              <span>{day}</span>
              {mood ? (
                <PawPrint
                  className="mt-1 h-3.5 w-3.5"
                  color={MOOD_CSS_VAR[mood]}
                />
              ) : null}
            </button>
          )
        })}
      </section>
    </main>
  )
}

const meta = {
  title: 'Home/MonthCalendar',
  component: MonthCalendarPreview,
  parameters: { layout: 'centered' },
  tags: ['autodocs'],
} satisfies Meta<typeof MonthCalendarPreview>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}
