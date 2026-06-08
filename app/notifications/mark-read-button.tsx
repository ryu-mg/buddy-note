'use client'

import { useTransition } from 'react'
import { toast } from 'sonner'

import { markAllNotificationsRead } from './actions'

type MarkReadButtonProps = {
  disabled: boolean
}

export function MarkReadButton({ disabled }: MarkReadButtonProps) {
  const [pending, startTransition] = useTransition()

  return (
    <button
      type="button"
      disabled={disabled || pending}
      onClick={() => {
        startTransition(async () => {
          const result = await markAllNotificationsRead()
          if (result.ok) {
            toast.success('최근 알림을 확인했어요')
            return
          }
          toast.error(result.error)
        })
      }}
      className="rounded-[var(--radius-button)] border border-[var(--color-line)] px-3 py-2 text-[13px] font-semibold text-[var(--color-ink-soft)] transition-colors hover:bg-[var(--color-paper)] disabled:cursor-not-allowed disabled:opacity-40"
    >
      {pending ? '확인 중...' : '모두 읽음'}
    </button>
  )
}
