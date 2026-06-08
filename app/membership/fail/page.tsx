import Link from 'next/link'

import { recordMembershipPaymentFailure } from '../confirm'

type PageProps = {
  searchParams?: Promise<{
    orderId?: string
    code?: string
    message?: string
  }>
}

export const dynamic = 'force-dynamic'

export default async function MembershipFailPage({ searchParams }: PageProps) {
  const params = searchParams ? await searchParams : {}
  await recordMembershipPaymentFailure({
    orderId: params.orderId ?? null,
    code: params.code ?? null,
    message: params.message ?? null,
  })

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md flex-col items-center justify-center px-4 py-12 text-center">
      <div className="w-full rounded-[var(--radius-card)] border border-[var(--color-line)] bg-[var(--color-paper)] px-5 py-8">
        <p className="text-[12px] font-medium uppercase tracking-[0.14em] text-[var(--color-mute)]">
          payment
        </p>
        <h1 className="mt-2 text-[24px] font-semibold leading-[1.3] text-[var(--color-ink)]">
          결제가 이어지지 않았어요
        </h1>
        <p className="mt-3 text-[14px] leading-[1.65] text-[var(--color-ink-soft)]">
          {params.message ?? '카드나 Toss Pay 상태를 확인한 뒤 다시 시도해주세요.'}
        </p>
        <Link
          href="/membership"
          className="mt-6 inline-flex min-h-11 items-center justify-center rounded-[var(--radius-button)] bg-[var(--color-accent-cta)] px-5 text-[14px] font-semibold text-[var(--primary-foreground)] shadow-[var(--shadow-accent)] transition-opacity hover:opacity-90"
        >
          다시 시도하기
        </Link>
      </div>
    </main>
  )
}
