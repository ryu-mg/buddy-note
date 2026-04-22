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
          여긴 비어 있어요.
        </p>
      </div>

      <div className="flex flex-col items-center gap-2">
        <h1 className="text-[22px] font-semibold leading-[1.35] text-[var(--color-ink)]">
          찾을 수 없어요
        </h1>
        <p className="max-w-[28ch] text-[14px] leading-[1.6] text-[var(--color-ink-soft)]">
          혹시 URL을 한 번 더 확인해볼래요? 비공개로 돌렸거나 사라진 친구일 수 있어요.
        </p>
      </div>

      <Link
        href="/"
        className="rounded-[var(--radius-button)] bg-[var(--color-ink)] px-5 py-2.5 text-[14px] font-medium text-[var(--color-bg)] transition-opacity hover:opacity-90"
      >
        홈으로 가기
      </Link>
    </main>
  )
}
