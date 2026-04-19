import type { ReactNode } from 'react'

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-[var(--bg,#ffffff)] px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center gap-2">
          <div
            aria-hidden
            className="h-10 w-10 rounded-[10px] bg-[var(--accent,#e07a5f)]"
          />
          <p className="text-sm text-zinc-500">buddy-note</p>
        </div>
        <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
          {children}
        </div>
      </div>
    </main>
  )
}
