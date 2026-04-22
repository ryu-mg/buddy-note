'use client'

import { useEffect } from 'react'
import type { Option, OptionKey, Question } from '@/lib/pet-mbti'

type QuestionCardProps = {
  question: Question
  petName: string
  /** 1-based 질문 번호 (A11y H1 표기용) */
  index: number
  total: number
  value: OptionKey | null
  onChange: (v: OptionKey) => void
  /** A/B 키보드 단축 활성화 여부 */
  keyboardEnabled?: boolean
}

export function QuestionCard({
  question,
  petName,
  index,
  total,
  value,
  onChange,
  keyboardEnabled = true,
}: QuestionCardProps) {
  const displayName = petName.trim() || '반려동물'
  const headline = question.headline.replaceAll('버디', displayName)
  const prompt = question.prompt.replaceAll('버디', displayName)

  // A/B 단축 키 — 입력 필드 안에서만 비활성 (여기선 radio 뿐이라 항상 허용).
  useEffect(() => {
    if (!keyboardEnabled) return
    const keys: Record<string, OptionKey> = {
      a: 'A',
      b: 'B',
    }
    const onKey = (e: KeyboardEvent) => {
      // 입력 포커스 중엔 무시 (혹시 future input 추가 대비).
      const target = e.target as HTMLElement | null
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') &&
          (target as HTMLInputElement).type !== 'radio') {
        return
      }
      const k = e.key.toLowerCase()
      if (k in keys) {
        e.preventDefault()
        onChange(keys[k])
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [keyboardEnabled, onChange])

  return (
    <section
      aria-labelledby={`${question.id}-title`}
      className="mx-auto w-full max-w-md"
    >
      <article className="relative rounded-[var(--radius-card)] border border-[var(--color-line)] bg-[var(--color-paper)] px-6 py-7 shadow-[var(--shadow-card-soft)] motion-safe:[transform:rotate(-0.6deg)] motion-reduce:rotate-0">
        <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-[var(--color-mute)]">
          질문 {index} / {total}
        </p>
        <h1
          id={`${question.id}-title`}
          className="mt-3 text-[20px] font-bold leading-[1.35] text-[var(--color-ink)]"
        >
          {headline}
        </h1>
        <p className="mt-1.5 text-[14px] text-[var(--color-ink-soft)]">
          {prompt}
        </p>

        <fieldset className="mt-5 flex flex-col gap-2">
          <legend className="sr-only">{prompt}</legend>
          {question.options.map((opt) => (
            <OptionRow
              key={opt.key}
              name={question.id}
              option={opt}
              checked={value === opt.key}
              onSelect={() => onChange(opt.key)}
            />
          ))}
        </fieldset>
      </article>
    </section>
  )
}

function OptionRow({
  name,
  option,
  checked,
  onSelect,
}: {
  name: string
  option: Option
  checked: boolean
  onSelect: () => void
}) {
  return (
    <label
      className={[
        'group/option flex cursor-pointer items-start gap-3 rounded-[10px] border-2 px-4 py-3 transition-all duration-200 ease-out motion-reduce:transition-none',
        checked
          ? 'border-[var(--color-accent-brand)] bg-[var(--color-accent-brand-soft)] shadow-[var(--shadow-accent)]'
          : 'border-transparent bg-[var(--color-bg)] hover:border-[var(--color-line)]',
      ].join(' ')}
    >
      <input
        type="radio"
        name={name}
        value={option.key}
        checked={checked}
        onChange={onSelect}
        className="peer sr-only"
      />
      <span
        aria-hidden
        className={[
          'mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 text-[11px] font-semibold transition-colors',
          checked
            ? 'border-[var(--color-accent-brand)] bg-[var(--color-accent-brand)] text-[var(--primary-foreground)]'
            : 'border-[var(--color-line)] bg-[var(--color-bg)] text-[var(--color-mute)] group-hover/option:border-[var(--color-ink-soft)]',
        ].join(' ')}
      >
        {option.key}
      </span>
      <span
        className={[
          'text-[15px] leading-[1.5]',
          checked
            ? 'font-semibold text-[var(--color-ink)]'
            : 'text-[var(--color-ink-soft)]',
        ].join(' ')}
      >
        {option.label}
      </span>
    </label>
  )
}
