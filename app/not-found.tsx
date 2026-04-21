import Link from 'next/link'

import { BuddyTilted } from '@/components/illustrations/buddy-tilted'

export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md flex-col items-center justify-center gap-6 px-6 py-16 text-center">
      <BuddyTilted className="h-32 w-44" />

      <div className="flex flex-col items-center gap-2">
        <h1 className="text-[22px] font-semibold leading-[1.35] text-[var(--color-ink)]">
          찾을 수 없어요
        </h1>
        <p className="max-w-[30ch] text-[14px] leading-[1.6] text-[var(--color-ink-soft)]">
          내가 이 길은 아직 못 찾았어. 주소를 한 번 더 확인해볼래?
        </p>
      </div>

      <div className="flex flex-col items-center gap-3">
        <Link
          href="/"
          className="rounded-[10px] bg-[var(--color-ink)] px-5 py-2.5 text-[14px] font-medium text-white transition-opacity hover:opacity-90"
        >
          홈으로
        </Link>
        <Link
          href="/auth/login"
          className="text-[14px] leading-[1.5] text-[var(--color-mute)] underline underline-offset-4 transition-opacity hover:opacity-80"
        >
          로그인
        </Link>
      </div>
    </main>
  )
}
