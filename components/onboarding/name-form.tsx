'use client'

export type Species = 'dog' | 'cat'

export type NameFormValues = {
  name: string
  species: Species
  breed: string
}

type NameFormProps = {
  value: NameFormValues
  onChange: (next: NameFormValues) => void
  /** 서버 혹은 부모에서 내려오는 에러 메시지 (선택) */
  error?: string | null
}

export function NameForm({ value, onChange, error }: NameFormProps) {
  const set = <K extends keyof NameFormValues>(key: K, v: NameFormValues[K]) =>
    onChange({ ...value, [key]: v })

  return (
    <section
      aria-labelledby="step0-title"
      className="mx-auto w-full max-w-md"
    >
      <article className="rounded-[12px] border border-[var(--line,#e5e7eb)] bg-[var(--paper,#fafaf5)] px-6 py-7 shadow-[0_1px_2px_rgba(0,0,0,0.04),0_8px_24px_-12px_rgba(0,0,0,0.08)] motion-safe:[transform:rotate(-0.6deg)] motion-reduce:rotate-0">
        <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-[var(--mute,#6b7280)]">
          시작하기
        </p>
        <h1
          id="step0-title"
          className="mt-3 text-[20px] font-bold leading-[1.35] text-[var(--ink,#1a1a1a)]"
        >
          우리 아이를 소개해주세요
        </h1>
        <p className="mt-1.5 text-[14px] text-[var(--ink-soft,#3f3f3f)]">
          이름, 종, 그리고 품종까지 알려주면 돼요.
        </p>

        <div className="mt-6 flex flex-col gap-5">
          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="pet-name"
              className="text-[13px] font-medium text-[var(--ink,#1a1a1a)]"
            >
              이름
            </label>
            <input
              id="pet-name"
              name="name"
              type="text"
              required
              aria-required="true"
              aria-invalid={Boolean(error)}
              aria-describedby={error ? 'name-form-error' : undefined}
              autoComplete="nickname"
              maxLength={24}
              value={value.name}
              onChange={(e) => set('name', e.target.value)}
              placeholder="예) 마루"
              className="w-full rounded-[8px] border border-[var(--line,#e5e7eb)] bg-white px-3 py-2.5 text-[15px] text-[var(--ink,#1a1a1a)] placeholder:text-zinc-400 focus:border-[var(--accent,#e07a5f)] focus:outline-none focus:ring-2 focus:ring-[var(--accent,#e07a5f)]/30"
            />
          </div>

          <fieldset className="flex flex-col gap-1.5">
            <legend className="text-[13px] font-medium text-[var(--ink,#1a1a1a)]">
              종
            </legend>
            <div className="flex gap-2">
              {(
                [
                  { key: 'dog' as Species, label: '강아지' },
                  { key: 'cat' as Species, label: '고양이' },
                ]
              ).map((opt) => {
                const selected = value.species === opt.key
                return (
                  <label
                    key={opt.key}
                    className={[
                      'flex flex-1 cursor-pointer items-center justify-center rounded-[8px] border-2 px-3 py-2.5 text-[14px] transition-colors motion-reduce:transition-none',
                      selected
                        ? 'border-[var(--accent,#e07a5f)] bg-[var(--accent-soft,#fde6e0)] text-[var(--ink,#1a1a1a)]'
                        : 'border-[var(--line,#e5e7eb)] bg-white text-[var(--ink-soft,#3f3f3f)] hover:border-[var(--ink-soft,#3f3f3f)]',
                    ].join(' ')}
                  >
                    <input
                      type="radio"
                      name="species"
                      value={opt.key}
                      checked={selected}
                      onChange={() => set('species', opt.key)}
                      className="sr-only"
                    />
                    {opt.label}
                  </label>
                )
              })}
            </div>
          </fieldset>

          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="pet-breed"
              className="text-[13px] font-medium text-[var(--ink,#1a1a1a)]"
            >
              품종 <span className="font-normal text-[var(--mute,#6b7280)]">(믹스도 괜찮아요)</span>
            </label>
            <input
              id="pet-breed"
              name="breed"
              type="text"
              maxLength={40}
              value={value.breed}
              onChange={(e) => set('breed', e.target.value)}
              placeholder="예) 푸들, 시츄-푸들 믹스"
              className="w-full rounded-[8px] border border-[var(--line,#e5e7eb)] bg-white px-3 py-2.5 text-[15px] text-[var(--ink,#1a1a1a)] placeholder:text-zinc-400 focus:border-[var(--accent,#e07a5f)] focus:outline-none focus:ring-2 focus:ring-[var(--accent,#e07a5f)]/30"
            />
          </div>

          {error ? (
            <p
              id="name-form-error"
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
