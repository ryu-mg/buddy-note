'use client'

import { X } from 'lucide-react'
import { useEffect, useState, useTransition } from 'react'

import {
  completeFirstEntryTutorial,
  dismissFirstEntryTutorial,
} from '@/app/tutorial/actions'
import { Button } from '@/components/ui/button'
import { FIRST_ENTRY_TUTORIAL_STEPS } from '@/lib/tutorial/first-entry-tutorial'

export function FirstEntryTutorialSheet() {
  const [open, setOpen] = useState(true)
  const [stepIndex, setStepIndex] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const step = FIRST_ENTRY_TUTORIAL_STEPS[stepIndex]
  const isLast = stepIndex === FIRST_ENTRY_TUTORIAL_STEPS.length - 1

  useEffect(() => {
    if (!open) return

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        dismiss()
      }
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  })

  if (!open || !step) return null

  function goNext() {
    if (!isLast) {
      setStepIndex((current) => current + 1)
    }
  }

  function dismiss() {
    if (isPending) return

    setError(null)
    startTransition(async () => {
      const result = await dismissFirstEntryTutorial()
      if (result?.error) {
        setError(result.error)
        return
      }
      setOpen(false)
    })
  }

  function complete() {
    if (isPending) return

    setError(null)
    startTransition(async () => {
      const result = await completeFirstEntryTutorial()
      if (result?.error) setError(result.error)
    })
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="first-entry-tutorial-title"
      className="fixed inset-0 z-50 flex items-end justify-center bg-[var(--color-ink)]/20 px-3 pb-3"
    >
      <section
        className="w-full max-w-md rounded-t-[var(--radius-card)] border border-[var(--color-line)] bg-[var(--color-bg)] px-4 pb-5 pt-4 shadow-[var(--shadow-polaroid)]"
        onClick={!isLast ? goNext : undefined}
      >
        <div className="mx-auto mb-4 h-1 w-10 rounded-[var(--radius-pill)] bg-[var(--color-line)]" />

        <div className="mb-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-1.5">
            {FIRST_ENTRY_TUTORIAL_STEPS.map((item, index) => (
              <span
                key={item.id}
                aria-hidden
                className={[
                  'h-1.5 rounded-[var(--radius-pill)] transition-all',
                  index === stepIndex
                    ? 'w-5 bg-[var(--color-accent-brand)]'
                    : 'w-1.5 bg-[var(--color-line)]',
                ].join(' ')}
              />
            ))}
            <span className="ml-1 text-[12px] font-medium text-[var(--color-mute)]">
              {stepIndex + 1} / {FIRST_ENTRY_TUTORIAL_STEPS.length}
            </span>
          </div>
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation()
              dismiss()
            }}
            disabled={isPending}
            aria-label="튜토리얼 닫기"
            className="inline-flex size-9 items-center justify-center rounded-[var(--radius-button)] text-[var(--color-mute)] transition-colors hover:bg-[var(--color-paper)] hover:text-[var(--color-ink)] disabled:opacity-50"
          >
            <X aria-hidden className="size-4" strokeWidth={1.8} />
          </button>
        </div>

        <div className="flex flex-col gap-2">
          <h2
            id="first-entry-tutorial-title"
            className="text-[20px] font-semibold text-[var(--color-ink)]"
          >
            {step.title}
          </h2>
          <p className="text-[14px] leading-[1.65] text-[var(--color-ink-soft)]">
            {step.body}
          </p>
        </div>

        {error ? (
          <p role="alert" className="mt-3 text-[13px] text-[var(--color-error)]">
            {error}
          </p>
        ) : null}

        <div className="mt-5 flex gap-2">
          {isLast && step.secondaryCta ? (
            <Button
              type="button"
              variant="outline"
              size="lg"
              className="min-h-11 flex-1 rounded-[var(--radius-button)] border-[var(--color-line)] bg-[var(--color-bg)] text-[var(--color-ink-soft)] hover:bg-[var(--color-paper)] hover:text-[var(--color-ink)]"
              onClick={(event) => {
                event.stopPropagation()
                dismiss()
              }}
              disabled={isPending}
            >
              {step.secondaryCta.label}
            </Button>
          ) : null}
          <Button
            type="button"
            size="lg"
            className="min-h-11 flex-1 rounded-[var(--radius-button)] bg-[var(--color-accent-cta)] text-[var(--primary-foreground)] shadow-[var(--shadow-accent)] hover:opacity-90"
            onClick={(event) => {
              event.stopPropagation()
              if (isLast) {
                complete()
                return
              }
              goNext()
            }}
            disabled={isPending}
          >
            {step.primaryCta.label}
          </Button>
        </div>
      </section>
    </div>
  )
}
