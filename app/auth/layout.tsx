import type { ReactNode } from 'react'

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-[var(--color-bg)] px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center gap-2">
          <div
            aria-hidden
            className="h-10 w-10 rounded-[var(--radius-button)] bg-[var(--color-accent-brand)]"
          />
          <p className="text-sm text-[var(--color-mute)]">buddy-note</p>
        </div>
        <div className="rounded-[var(--radius-card)] border border-[var(--color-line)] bg-[var(--color-paper)] p-6 shadow-[var(--shadow-card-soft)]">
          {children}
        </div>
      </div>
    </main>
  )
}
