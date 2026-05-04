import type { ReactNode } from 'react'

import { BuddyHappy } from '@/components/illustrations/buddy-happy'

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-[var(--color-bg)] px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="mb-7 flex flex-col items-center gap-3 text-center">
          <BuddyHappy className="h-16 w-20" />
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--color-mute)]">
              buddy-note
            </p>
            <h1 className="mt-2 font-serif text-[26px] font-semibold leading-tight text-[var(--color-ink)]">
              다시 기억하러 가요
            </h1>
          </div>
        </div>
        <div className="rounded-[var(--radius-card)] border border-[var(--color-line)] bg-[var(--color-paper)] p-6 shadow-[var(--shadow-card-soft)]">
          {children}
        </div>
      </div>
    </main>
  )
}
