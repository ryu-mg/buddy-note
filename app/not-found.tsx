import Link from 'next/link'

export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md flex-col items-center justify-center gap-6 px-6 py-16 text-center">
      <div
        aria-hidden="true"
        className="bg-[var(--color-paper)] px-8 pb-10 pt-6 ring-1 ring-[var(--color-line)] motion-safe:-rotate-[1.2deg] motion-reduce:rotate-0"
      >
        <p
          className="text-[18px] leading-[1.6] text-[var(--color-ink-soft)]"
          style={{ fontFamily: 'var(--font-serif)' }}
        >
          이 페이지는 비어 있어요.
        </p>
      </div>

      <div className="flex flex-col items-center gap-2">
        <h1 className="text-[22px] font-semibold leading-[1.35] text-[var(--color-ink)]">
          찾을 수 없어요
        </h1>
        <p className="max-w-[30ch] text-[14px] leading-[1.6] text-[var(--color-ink-soft)]">
          주소를 한 번 더 확인해볼래요? 혹시 로그인이 필요한 페이지였을 수도 있어요.
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
