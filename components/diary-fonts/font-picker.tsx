'use client'

import { useMemo, useState, useTransition } from 'react'
import type { CSSProperties } from 'react'
import { toast } from 'sonner'

import { saveDiaryFont } from '@/app/pet/font/actions'
import {
  DIARY_FONT_PRESETS,
  resolveDiaryFontPreset,
} from '@/lib/diary-fonts/presets'
import { withJosa } from '@/lib/korean-josa'
import type { DiaryFontKey } from '@/types/database'

type DiaryFontPickerProps = {
  initialFontKey: DiaryFontKey
  canSave: boolean
  petName: string
}

export function DiaryFontPicker({
  initialFontKey,
  canSave,
  petName,
}: DiaryFontPickerProps) {
  const [selectedKey, setSelectedKey] = useState<DiaryFontKey>(initialFontKey)
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()
  const selected = resolveDiaryFontPreset(selectedKey)
  const previewStyle = useMemo(
    () =>
      ({
        '--font-diary-writing': selected.cssValue,
      }) as CSSProperties,
    [selected.cssValue],
  )

  function save() {
    const formData = new FormData()
    formData.set('fontKey', selectedKey)
    setError(null)
    startTransition(async () => {
      const result = await saveDiaryFont(formData)
      if (result.ok) {
        toast.success('일기 글꼴을 저장했어요')
        return
      }
      setError(result.error)
      toast.error(result.error)
    })
  }

  return (
    <div className="flex flex-col gap-6">
      <section
        aria-label="글꼴 미리보기"
        className="rounded-[var(--radius-card)] border border-[var(--color-line)] bg-[var(--color-paper)] px-5 py-5"
        style={previewStyle}
      >
        <p className="text-[12px] font-medium uppercase tracking-[0.14em] text-[var(--color-mute)]">
          preview
        </p>
        <h2 className="mt-1 text-[20px] font-semibold text-[var(--color-ink)]">
          {selected.label}
        </h2>
        <p className="diary-writing-font mt-4 text-[19px] leading-[1.75] text-[var(--color-ink)]">
          오늘은 {withJosa(petName, '이/가')} 먼저 말 걸고 싶은 날이었어. 네가 남겨준
          한 줄을 내가 오래 기억해둘게.
        </p>
      </section>

      <section className="grid grid-cols-1 gap-3" aria-label="글꼴 선택">
        {DIARY_FONT_PRESETS.map((preset) => {
          const selectedPreset = preset.key === selectedKey
          return (
            <button
              key={preset.key}
              type="button"
              aria-pressed={selectedPreset}
              onClick={() => {
                setSelectedKey(preset.key)
                setError(null)
              }}
              className={[
                'rounded-[var(--radius-card)] border bg-[var(--color-bg)] px-4 py-4 text-left transition-colors',
                selectedPreset
                  ? 'border-[var(--color-accent-brand)] ring-2 ring-[var(--color-accent-brand)]/20'
                  : 'border-[var(--color-line)] hover:border-[var(--color-accent-brand)]',
              ].join(' ')}
            >
              <span className="text-[15px] font-semibold text-[var(--color-ink)]">
                {preset.label}
              </span>
              <span className="mt-1 block text-[12px] leading-[1.45] text-[var(--color-mute)]">
                {preset.description}
              </span>
            </button>
          )
        })}
      </section>

      {!canSave ? (
        <p className="rounded-[var(--radius-input)] bg-[var(--color-accent-brand-soft)] px-3 py-2 text-[13px] leading-[1.55] text-[var(--color-ink-soft)]">
          지금은 미리보기만 가능해요. 멤버십이 열리면 이 글꼴을 저장할 수 있어요.
        </p>
      ) : null}

      {error ? (
        <p role="alert" className="text-[13px] text-[var(--color-error)]">
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
