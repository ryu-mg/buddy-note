import Link from 'next/link'

import { confirmMembershipPayment } from '../confirm'

type PageProps = {
  searchParams?: Promise<{
    paymentKey?: string
    orderId?: string
    amount?: string
  }>
}

export const dynamic = 'force-dynamic'

export default async function MembershipSuccessPage({ searchParams }: PageProps) {
  const params = searchParams ? await searchParams : {}
  const result = await confirmMembershipPayment({
    paymentKey: params.paymentKey ?? null,
    orderId: params.orderId ?? null,
    amount: params.amount ?? null,
  })

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md flex-col items-center justify-center px-4 py-12 text-center">
      <div className="w-full rounded-[var(--radius-card)] border border-[var(--color-line)] bg-[var(--color-paper)] px-5 py-8">
        <p className="text-[12px] font-medium uppercase tracking-[0.14em] text-[var(--color-mute)]">
          membership
        </p>
        <h1 className="mt-2 text-[24px] font-semibold leading-[1.3] text-[var(--color-ink)]">
          {result.ok ? '멤버십이 열렸어요' : '결제를 마무리하지 못했어요'}
        </h1>
        <p className="mt-3 text-[14px] leading-[1.65] text-[var(--color-ink-soft)]">
          {result.ok
            ? '이제 버디가 일기를 다시 써주고, 글꼴과 테마도 바꿀 수 있어요.'
            : result.error}
        </p>
        <Link
          href={result.ok ? '/membership' : '/more'}
          className="mt-6 inline-flex min-h-11 items-center justify-center rounded-[var(--radius-button)] bg-[var(--color-accent-cta)] px-5 text-[14px] font-semibold text-[var(--primary-foreground)] shadow-[var(--shadow-accent)] transition-opacity hover:opacity-90"
        >
          {result.ok ? '멤버십 보기' : '돌아가기'}
        </Link>
      </div>
    </main>
  )
}
