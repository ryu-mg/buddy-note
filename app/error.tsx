'use client'

import Link from 'next/link'
import { useEffect } from 'react'

type ErrorProps = {
  error: Error & { digest?: string }
  reset: () => void
}

export default function Error({ error, reset }: ErrorProps) {
  useEffect(() => {
    // TODO: client error → Sentry (Sentry wiring 이후 이 지점에서 report)
    console.error(error)
  }, [error])

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md flex-col items-center justify-center gap-6 px-6 py-16 text-center">
      <div
        aria-hidden="true"
        className="bg-[var(--color-paper)] p-6 ring-1 ring-[var(--color-line)] motion-safe:-rotate-[0.6deg] motion-reduce:rotate-0"
      >
        <p
          className="text-[18px] leading-[1.6] text-[var(--color-ink-soft)]"
          style={{ fontFamily: 'var(--font-serif)' }}
        >
          잠깐 숨을 고르는 중이에요.
        </p>
      </div>

      <div className="flex flex-col items-center gap-2">
        <h1 className="text-[22px] font-semibold leading-[1.35] text-[var(--color-ink)]">
          잠깐 길을 잃었어요
        </h1>
        <p className="max-w-[30ch] text-[14px] leading-[1.6] text-[var(--color-ink-soft)]">
          예상치 못한 문제가 생겼어요. 한 번만 더 시도해볼까요?
        </p>
        {error.digest && (
          <p className="text-[12px] leading-[1.5] text-[var(--color-mute)]">
            참조 코드: {error.digest}
          </p>
        )}
      </div>

      <div className="flex flex-col items-center gap-3">
        <button
          type="button"
          onClick={reset}
          className="rounded-[10px] bg-[var(--color-ink)] px-5 py-2.5 text-[14px] font-medium text-white transition-opacity hover:opacity-90"
        >
          다시 시도
        </button>
        <Link
          href="/"
          className="text-[14px] leading-[1.5] text-[var(--color-mute)] underline underline-offset-4 transition-opacity hover:opacity-80"
        >
          홈으로
        </Link>
      </div>
    </main>
  )
}
