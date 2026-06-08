import Link from 'next/link'
import { redirect } from 'next/navigation'
import { Check } from 'lucide-react'

import { CheckoutButton } from '@/app/membership/checkout-button'
import { BackLink } from '@/components/layout/back-link'
import { resolveEntitlements } from '@/lib/billing/entitlements'
import {
  MEMBERSHIP_FEATURES,
  MEMBERSHIP_MONTHLY_AMOUNT_KRW,
} from '@/lib/billing/plan'
import { getTossPaymentConfig } from '@/lib/billing/toss'
import { getMembershipSnapshot } from '@/lib/billing/server'
import { withJosa } from '@/lib/korean-josa'
import { createClient } from '@/lib/supabase/server'
import type { PaymentEnvironment, PaymentOrderStatus } from '@/types/database'

export const dynamic = 'force-dynamic'

type PaymentHistoryItem = {
  id: string
  order_name: string
  amount: number
  environment: PaymentEnvironment
  status: PaymentOrderStatus
  approved_at: string | null
  created_at: string
}

type MembershipPagePet = {
  id: string
  name: string
}

type MembershipPageProps = {
  searchParams?: Promise<{ returnTo?: string }>
}

export default async function MembershipPage({
  searchParams,
}: MembershipPageProps) {
  const returnTo = resolveReturnTo((await searchParams)?.returnTo)
  const returnLabel = buildReturnLabel(returnTo)
  const supabase = await createClient()
  if (!supabase) redirect('/auth/login')

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const [petResult, membership, historyResult] = await Promise.all([
    supabase
      .from('pets')
      .select('id, name')
      .eq('user_id', user.id)
      .limit(1)
      .maybeSingle<MembershipPagePet>(),
    getMembershipSnapshot(supabase, user.id),
    supabase
      .from('membership_payment_orders')
      .select('id, order_name, amount, environment, status, approved_at, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(6)
      .returns<PaymentHistoryItem[]>(),
  ])

  const pet = petResult.data
  if (!pet) redirect('/onboarding')

  const petName = pet.name.trim() || '버디'
  const entitlements = resolveEntitlements(membership)
  const active = entitlements.themeChange
  const tossConfig = getTossPaymentConfig()

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md flex-col gap-6 px-4 pb-24 pt-8">
      <div className="flex items-center gap-1">
        <BackLink href={returnTo} label={returnLabel} />
        <h1 className="truncate text-[24px] font-semibold leading-[1.25] text-[var(--color-ink)]">
          멤버십
        </h1>
      </div>

      <header className="px-1">
        <h2 className="text-[26px] font-semibold leading-[1.25] text-[var(--color-ink)]">
          <span className="whitespace-nowrap">{withJosa(petName, '이/가')} 더</span>{' '}
          <span className="whitespace-nowrap">
            {petName}답게 남기는 기록
          </span>
        </h2>
        <p className="mt-3 text-[14px] leading-[1.65] text-[var(--color-ink-soft)]">
          한 번 더 써보고, 말투에 맞는 글꼴과 앨범 색을 고를 수 있어요.
        </p>
        <div className="mt-5 flex items-end gap-1">
          <span className="text-[30px] font-bold text-[var(--color-ink)]">
            {MEMBERSHIP_MONTHLY_AMOUNT_KRW.toLocaleString('ko-KR')}원
          </span>
          <span className="pb-1 text-[13px] text-[var(--color-mute)]">/ 월</span>
        </div>
      </header>

      <section className="rounded-[var(--radius-card)] border border-[var(--color-line)] bg-[var(--color-bg)] px-4 py-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-[17px] font-semibold text-[var(--color-ink)]">
              현재 상태
            </h2>
            <p className="mt-1 text-[13px] text-[var(--color-mute)]">
              {active ? '멤버십 기능을 사용할 수 있어요.' : '아직 멤버십이 열리지 않았어요.'}
            </p>
          </div>
          <span
            className={[
              'rounded-[var(--radius-pill)] px-3 py-1 text-[12px] font-semibold',
              active
                ? 'bg-[var(--color-accent-brand-soft)] text-[var(--color-accent-brand)]'
                : 'bg-[var(--color-paper)] text-[var(--color-mute)]',
            ].join(' ')}
          >
            {membership?.status ?? 'free'}
          </span>
        </div>
        {membership?.currentPeriodEndsAt ? (
          <p className="mt-3 text-[12px] text-[var(--color-mute)]">
            다음 갱신 기준일 {formatDate(membership.currentPeriodEndsAt)}
          </p>
        ) : null}
      </section>

      <section className="flex flex-col gap-3">
        {MEMBERSHIP_FEATURES.map((feature) => (
          <div
            key={feature.key}
            className="flex gap-3 rounded-[var(--radius-card)] border border-[var(--color-line)] bg-[var(--color-bg)] px-4 py-4"
          >
            <span className="mt-0.5 inline-flex size-7 shrink-0 items-center justify-center rounded-full bg-[var(--color-accent-brand-soft)] text-[var(--color-accent-brand)]">
              <Check aria-hidden className="size-4" strokeWidth={2} />
            </span>
            <div>
              <h2 className="text-[15px] font-semibold text-[var(--color-ink)]">
                {feature.label}
              </h2>
              <p className="mt-1 text-[13px] leading-[1.55] text-[var(--color-mute)]">
                {feature.description}
              </p>
            </div>
          </div>
        ))}
      </section>

      {!active ? (
        <section className="flex flex-col gap-3">
          <CheckoutButton />
          {!tossConfig.ok ? (
            <p className="rounded-[var(--radius-input)] bg-[var(--color-accent-brand-soft)] px-3 py-2 text-[12px] leading-[1.55] text-[var(--color-ink-soft)]">
              {tossConfig.error}
            </p>
          ) : (
            <p className="text-center text-[12px] text-[var(--color-mute)]">
              현재 {tossConfig.config.environment === 'live' ? '실결제' : '개발 결제'} 환경이에요.
            </p>
          )}
        </section>
      ) : (
        <Link
          href="/pet/theme"
          className="flex min-h-12 items-center justify-center rounded-[var(--radius-button)] bg-[var(--color-accent-cta)] px-5 text-[15px] font-semibold text-[var(--primary-foreground)] shadow-[var(--shadow-accent)] transition-opacity hover:opacity-90"
        >
          테마 고르러 가기
        </Link>
      )}

      <section className="flex flex-col gap-3">
        <h2 className="text-[18px] font-semibold text-[var(--color-ink)]">
          결제 내역
        </h2>
        {historyResult.data && historyResult.data.length > 0 ? (
          <ol className="flex flex-col gap-2">
            {historyResult.data.map((item) => (
              <li
                key={item.id}
                className="rounded-[var(--radius-card)] border border-[var(--color-line)] bg-[var(--color-bg)] px-4 py-3"
              >
                <div className="flex items-center justify-between gap-3">
                  <span className="text-[14px] font-semibold text-[var(--color-ink)]">
                    {item.order_name}
                  </span>
                  <span className="text-[13px] text-[var(--color-ink-soft)]">
                    {item.amount.toLocaleString('ko-KR')}원
                  </span>
                </div>
                <p className="mt-1 text-[12px] text-[var(--color-mute)]">
                  {paymentStatusLabel(item.status)} · {item.environment === 'live' ? '실결제' : '개발'} · {formatDate(item.approved_at ?? item.created_at)}
                </p>
              </li>
            ))}
          </ol>
        ) : (
          <p className="rounded-[var(--radius-card)] border border-[var(--color-line)] bg-[var(--color-paper)] px-4 py-5 text-[13px] leading-[1.55] text-[var(--color-mute)]">
            아직 결제 내역이 없어요.
          </p>
        )}
      </section>
    </main>
  )
}

function resolveReturnTo(value: string | undefined): string {
  if (!value) return '/more'
  if (value === '/' || value === '/week') return value
  if (value.startsWith('/diary/') && !value.startsWith('//')) return value
  return '/more'
}

function buildReturnLabel(returnTo: string): string {
  if (returnTo === '/') return '홈으로 돌아가기'
  if (returnTo === '/week') return '주간으로 돌아가기'
  if (returnTo.startsWith('/diary/')) return '일기로 돌아가기'
  return '더보기로 돌아가기'
}

function formatDate(iso: string): string {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return ''
  return `${date.getFullYear()}.${date.getMonth() + 1}.${date.getDate()}`
}

function paymentStatusLabel(status: PaymentOrderStatus): string {
  switch (status) {
    case 'pending':
      return '준비 중'
    case 'ready':
      return '결제 대기'
    case 'approved':
      return '승인'
    case 'failed':
      return '실패'
    case 'canceled':
      return '취소'
  }
}
