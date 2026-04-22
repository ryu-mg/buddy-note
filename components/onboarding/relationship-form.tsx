import { withJosa } from '@/lib/korean-josa'

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
      <article className="rounded-[var(--radius-card)] border border-[var(--color-line)] bg-[var(--color-paper)] px-6 py-7 shadow-[var(--shadow-card-soft)] motion-safe:[transform:rotate(-0.6deg)] motion-reduce:rotate-0">
        <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-[var(--color-mute)]">
          반려인 호칭
        </p>
        <h1
          id="relationship-title"
          className="mt-3 text-[20px] font-bold leading-[1.35] text-[var(--color-ink)]"
        >
          {withJosa(trimmedName, '와/과')}는 어떤 사이인가요?
        </h1>
        <p className="mt-1.5 text-[14px] text-[var(--color-ink-soft)]">
          버디노트에서 반려인을 부르는 말로 쓸게요.
        </p>

        <div className="mt-6 flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="companion-relationship"
              className="text-[13px] font-medium text-[var(--color-ink)]"
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
              className="w-full rounded-[var(--radius-input)] border border-[var(--color-line)] bg-[var(--color-bg)] px-3 py-2.5 text-[15px] text-[var(--color-ink-soft)] placeholder:text-[var(--color-mute)]/60 focus:border-[var(--color-accent-brand)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent-brand)]/30"
            />
          </div>

          {error ? (
            <p
              id="relationship-form-error"
              role="alert"
              className="rounded-[var(--radius-input)] bg-[var(--color-accent-brand-soft)] px-3 py-2 text-[13px] text-[var(--color-error)]"
            >
              {error}
            </p>
          ) : null}
        </div>
      </article>
    </section>
  )
}
