'use client'

import { useState, useTransition } from 'react'
import { toast } from 'sonner'

import { togglePublic } from '@/app/actions'
import { ShareLink } from './share-link'

type PublicToggleProps = {
  petId: string
  initialPublic: boolean
  slug: string
}

export function PublicToggle({
  petId,
  initialPublic,
  slug,
}: PublicToggleProps) {
  const [isPublic, setIsPublic] = useState(initialPublic)
  const [pending, startTransition] = useTransition()

  function handleToggle() {
    startTransition(async () => {
      const result = await togglePublic(petId)
      if (result.ok) {
        setIsPublic(result.is_public)
        toast.success(
          result.is_public
            ? '프로필을 공개로 바꿨어요'
            : '프로필을 다시 비공개로 바꿨어요',
        )
      } else {
        toast.error(result.error)
      }
    })
  }

  const statusLabel = isPublic ? '공개중' : '비공개'
  const buttonLabel = isPublic ? '비공개로' : '공개로'

  return (
    <div className="flex flex-col items-start gap-2 md:items-end">
      <div className="flex items-center gap-3">
        <span className="text-[12px] font-medium uppercase tracking-[0.14em] text-[var(--color-mute)]">
          프로필
        </span>
        <span
          aria-live="polite"
          className={
            isPublic
              ? 'inline-flex items-center gap-1.5 rounded-[var(--radius-pill)] bg-[var(--color-accent-brand-soft)] px-2.5 py-0.5 text-[12px] font-semibold text-[var(--color-ink-soft)]'
              : 'inline-flex items-center gap-1.5 rounded-[var(--radius-pill)] bg-[var(--color-line)] px-2.5 py-0.5 text-[12px] font-semibold text-[var(--color-ink-soft)]'
          }
        >
          <span
            className={
              isPublic
                ? 'size-1.5 rounded-full bg-[var(--color-accent-brand)]'
                : 'size-1.5 rounded-full bg-[var(--color-mute)]'
            }
            aria-hidden="true"
          />
          {statusLabel}
        </span>
        <button
          type="button"
          onClick={handleToggle}
          disabled={pending}
          aria-busy={pending}
          aria-pressed={isPublic}
          className="rounded-[var(--radius-button)] border border-[var(--color-line)] bg-[var(--color-bg)] px-3 py-1.5 text-[12px] font-semibold text-[var(--color-ink-soft)] transition-colors hover:border-[var(--color-accent-brand)] hover:text-[var(--color-accent-brand)] disabled:cursor-not-allowed disabled:opacity-50"
        >
          {pending ? '바꾸는 중…' : `${buttonLabel} 바꾸기`}
        </button>
      </div>
      {isPublic ? <ShareLink slug={slug} /> : null}
    </div>
  )
}
