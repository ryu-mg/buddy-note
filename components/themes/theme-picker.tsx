'use client'

import { useMemo, useState, useTransition } from 'react'
import type { CSSProperties } from 'react'
import { toast } from 'sonner'

import { savePetTheme } from '@/app/pet/theme/actions'
import { ThemeSwatch } from '@/components/themes/theme-swatch'
import {
  THEME_PRESETS,
  resolveThemePreset,
  type ThemePresetKey,
} from '@/lib/themes/presets'
import { buildThemeStyle } from '@/lib/themes/style'

type ThemePickerProps = {
  initialThemeKey: ThemePresetKey
  canSave: boolean
}

export function ThemePicker({ initialThemeKey, canSave }: ThemePickerProps) {
  const [selectedKey, setSelectedKey] = useState<ThemePresetKey>(initialThemeKey)
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()
  const selectedPreset = resolveThemePreset(selectedKey)
  const previewStyle = useMemo(
    () => buildThemeStyle(selectedKey) as CSSProperties,
    [selectedKey],
  )

  function save() {
    if (pending) return

    setError(null)
    const formData = new FormData()
    formData.set('themeKey', selectedKey)

    startTransition(async () => {
      const result = await savePetTheme(formData)
      if (result.ok) {
        toast.success('테마를 저장했어요')
        return
      }

      setError(result.error)
      toast.error(result.error)
    })
  }

  return (
    <div className="flex flex-col gap-6">
      <section
        aria-label="테마 미리보기"
        className="flex flex-col gap-4 rounded-[var(--radius-card)] border border-[var(--color-line)] bg-[var(--theme-paper)] px-5 py-5 shadow-[var(--shadow-card-soft)]"
        style={previewStyle}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[12px] font-medium uppercase tracking-[0.14em] text-[var(--color-mute)]">
              preview
            </p>
            <h2 className="mt-1 font-serif text-[28px] font-semibold text-[var(--color-ink)]">
              {selectedPreset.label}
            </h2>
          </div>
          <span
            className="rounded-[var(--radius-pill)] px-3 py-1 text-[12px] font-semibold"
            style={{
              backgroundColor: selectedPreset.colors.accentSoft,
              color: selectedPreset.colors.accent,
            }}
          >
            preset
          </span>
        </div>

        <div className="bg-[var(--color-bg)] p-4 pb-8 shadow-[var(--shadow-polaroid)] ring-1 ring-[var(--color-line)]">
          <div
            className="aspect-square"
            style={{ backgroundColor: selectedPreset.colors.accentSoft }}
          />
          <p
            className="mt-4 font-serif text-[16px] leading-[1.7]"
            style={{ color: selectedPreset.colors.moodHint }}
          >
            오늘의 앨범 색이 이렇게 바뀌어요.
          </p>
        </div>
      </section>

      <section aria-label="테마 선택" className="grid grid-cols-1 gap-3">
        {THEME_PRESETS.map((preset) => {
          const selected = preset.key === selectedKey
          return (
            <button
              key={preset.key}
              type="button"
              onClick={() => {
                setSelectedKey(preset.key)
                setError(null)
              }}
              aria-pressed={selected}
              className={[
                'flex min-h-[76px] items-center gap-3 rounded-[var(--radius-card)] border bg-[var(--color-bg)] px-4 py-3 text-left transition-colors',
                selected
                  ? 'border-[var(--color-accent-brand)] ring-2 ring-[var(--color-accent-brand)]/20'
                  : 'border-[var(--color-line)] hover:border-[var(--color-accent-brand)]',
              ].join(' ')}
            >
              <ThemeSwatch preset={preset} />
              <span className="min-w-0 flex-1">
                <span className="block text-[15px] font-semibold text-[var(--color-ink)]">
                  {preset.label}
                </span>
                <span className="mt-1 block text-[12px] leading-[1.45] text-[var(--color-mute)]">
                  {preset.description}
                </span>
              </span>
            </button>
          )
        })}
      </section>

      {!canSave ? (
        <p className="rounded-[var(--radius-input)] bg-[var(--color-accent-brand-soft)] px-3 py-2 text-[13px] leading-[1.55] text-[var(--color-ink-soft)]">
          지금은 미리보기만 가능해요. 멤버십 또는 무료 체험이 열리면 이
          테마를 저장할 수 있어요.
        </p>
      ) : null}

      {error ? (
        <p
          role="alert"
          className="rounded-[var(--radius-input)] bg-[var(--color-accent-brand-soft)] px-3 py-2 text-[13px] text-[var(--color-error)]"
        >
          {error}
        </p>
      ) : null}

      <button
        type="button"
        onClick={save}
        disabled={pending}
        className="min-h-12 rounded-[var(--radius-button)] bg-[var(--color-accent-cta)] px-5 text-[15px] font-semibold text-[var(--primary-foreground)] shadow-[var(--shadow-accent)] transition-opacity hover:opacity-90 disabled:opacity-60"
      >
        {pending ? '저장 중...' : '저장하기'}
      </button>
    </div>
  )
}
