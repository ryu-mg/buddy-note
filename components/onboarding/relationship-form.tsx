export function RelationshipForm({
  petName,
  value,
  onChange,
  error,
}: {
  petName: string
  value: string
  onChange: (next: string) => void
  error?: string | null
}) {
  const trimmedName = petName.trim() || '버디'

  return (
    <section aria-labelledby="relationship-title" className="mx-auto w-full max-w-md">
      <article className="rounded-[12px] border border-[var(--line,#e5e7eb)] bg-[var(--paper,#fafaf5)] px-6 py-7 shadow-[0_1px_2px_rgba(0,0,0,0.04),0_8px_24px_-12px_rgba(0,0,0,0.08)] motion-safe:[transform:rotate(-0.6deg)] motion-reduce:rotate-0">
        <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-[var(--mute,#6b7280)]">
          반려인 호칭
        </p>
        <h1
          id="relationship-title"
          className="mt-3 text-[20px] font-bold leading-[1.35] text-[var(--ink,#1a1a1a)]"
        >
          {trimmedName}과는 어떤 사이인가요?
        </h1>
        <p className="mt-1.5 text-[14px] text-[var(--ink-soft,#3f3f3f)]">
          버디노트에서 반려인을 부르는 말로 쓸게요.
        </p>

        <div className="mt-6 flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="companion-relationship"
              className="text-[13px] font-medium text-[var(--ink,#1a1a1a)]"
            >
              반려인 호칭
            </label>
            <input
              id="companion-relationship"
              type="text"
              required
              aria-required="true"
              aria-invalid={Boolean(error)}
              aria-describedby={error ? 'relationship-form-error' : undefined}
              maxLength={20}
              value={value}
              onChange={(e) => onChange(e.target.value)}
              placeholder="예) 누나"
              className="w-full rounded-[8px] border border-[var(--line,#e5e7eb)] bg-white px-3 py-2.5 text-[15px] text-[var(--color-ink-soft)] placeholder:text-[var(--color-mute)]/60 focus:border-[var(--accent,#e07a5f)] focus:outline-none focus:ring-2 focus:ring-[var(--accent,#e07a5f)]/30"
            />
          </div>

          {error ? (
            <p
              id="relationship-form-error"
              role="alert"
              className="rounded-[8px] bg-[var(--accent-soft,#fde6e0)] px-3 py-2 text-[13px] text-[var(--error,#b04a4a)]"
            >
              {error}
            </p>
          ) : null}
        </div>
      </article>
    </section>
  )
}
