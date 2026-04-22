'use client'

type FreeDescriptionFormProps = {
  petName: string
  value: string
  onChange: (value: string) => void
  error?: string | null
}

export function FreeDescriptionForm({
  petName,
  value,
  onChange,
  error,
}: FreeDescriptionFormProps) {
  const name = petName.trim() || '버디'

  return (
    <section aria-labelledby="free-description-title">
      <article className="rounded-[var(--radius-card)] border border-[var(--color-line)] bg-[var(--color-paper)] px-6 py-7 shadow-[var(--shadow-card-soft)] motion-safe:[transform:rotate(-0.35deg)] motion-reduce:rotate-0">
        <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-[var(--color-mute)]">
          더 들려줄 이야기
        </p>
        <h1
          id="free-description-title"
          className="mt-3 text-[22px] font-bold leading-[1.3] text-[var(--color-ink)]"
        >
          {name}만의 습관이 있나요?
        </h1>
        <p className="mt-2 text-[14px] leading-[1.6] text-[var(--color-ink-soft)]">
          좋아하는 말, 싫어하는 소리, 이상하게 꼭 하는 행동 같은 걸 짧게 남겨도 좋아요.
        </p>

        <label htmlFor="additional-info" className="sr-only">
          추가 이야기
        </label>
        <textarea
          id="additional-info"
          value={value}
          onChange={(e) => onChange(e.target.value.slice(0, 200))}
          maxLength={200}
          rows={5}
          placeholder="예) 비 오는 날 창밖 보는 걸 좋아해요"
          className="mt-5 min-h-32 w-full resize-none rounded-[var(--radius-input)] border border-[var(--color-line)] bg-[var(--color-bg)] px-4 py-3 text-[15px] leading-[1.55] text-[var(--color-ink)] placeholder:text-[var(--color-mute)]/60 focus:border-[var(--color-accent-brand)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent-brand)]/25"
        />
        <div className="mt-2 flex items-center justify-between gap-3">
          <p className="text-[12px] text-[var(--color-mute)]">선택 입력이에요.</p>
          <p className="text-[12px] tabular-nums text-[var(--color-mute)]">
            {value.length}/200
          </p>
        </div>

        {error ? (
          <p
            role="alert"
            className="mt-3 rounded-[var(--radius-input)] bg-[var(--color-accent-brand-soft)] px-3 py-2 text-[13px] text-[var(--color-error)]"
          >
            {error}
          </p>
        ) : null}
      </article>
    </section>
  )
}
