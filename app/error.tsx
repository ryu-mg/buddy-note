'use client'

import * as Sentry from '@sentry/nextjs'
import Link from 'next/link'
import { useEffect } from 'react'

import { BuddyTilted } from '@/components/illustrations/buddy-tilted'

type ErrorProps = {
  error: Error & { digest?: string }
  reset: () => void
}

export default function Error({ error, reset }: ErrorProps) {
  useEffect(() => {
    // DSN 있으면 Sentry 로, 없으면 console 로 — dev 에서 패리티 유지.
    if (process.env.NEXT_PUBLIC_SENTRY_DSN) {
      Sentry.captureException(error)
    } else {
      console.error(error)
    }
  }, [error])

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md flex-col items-center justify-center gap-6 px-6 py-16 text-center">
      <BuddyTilted className="h-32 w-44" />

      <div className="flex flex-col items-center gap-2">
        <h1 className="text-[22px] font-semibold leading-[1.35] text-[var(--color-ink)]">
          잠깐 길을 잃었어요
        </h1>
        <p className="max-w-[30ch] text-[14px] leading-[1.6] text-[var(--color-ink-soft)]">
          내가 잠깐 길을 놓쳤어. 한 번만 더 불러줄래?
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
