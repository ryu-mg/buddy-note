'use client'

import { useTransition } from 'react'
import { toast } from 'sonner'

import { createMembershipCheckout } from './actions'

export function CheckoutButton() {
  const [pending, startTransition] = useTransition()

  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => {
        startTransition(async () => {
          const result = await createMembershipCheckout()
          if (!result.ok) {
            toast.error(result.error)
            return
          }
          window.location.href = result.checkoutUrl
        })
      }}
      className="min-h-12 rounded-[var(--radius-button)] bg-[var(--color-accent-cta)] px-5 text-[15px] font-semibold text-[var(--primary-foreground)] shadow-[var(--shadow-accent)] transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
    >
      {pending ? '결제창 준비 중...' : '멤버십 시작하기'}
    </button>
  )
}
