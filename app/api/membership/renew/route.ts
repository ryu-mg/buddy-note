import type { SupabaseClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

import {
  MEMBERSHIP_MONTHLY_AMOUNT_KRW,
  MEMBERSHIP_ORDER_NAME,
  MEMBERSHIP_PLAN_KEY,
} from '@/lib/billing/plan'
import {
  buildGraceEndsAt,
  resolveRenewalPeriod,
  shouldRenewMembership,
} from '@/lib/billing/renewal'
import {
  buildMembershipOrderId,
  buildTossBasicAuthorization,
  getTossPaymentConfig,
} from '@/lib/billing/toss'
import { createNotificationIfAllowed } from '@/lib/notifications/delivery'
import { hasValidBearerToken } from '@/lib/ops/cron-auth'
import { createAdminClient } from '@/lib/supabase/admin'
import type { Json } from '@/types/database'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 60

type UntypedSupabase = SupabaseClient

type DueMembership = {
  id: string
  user_id: string
  status: 'active' | 'past_due' | 'canceling' | 'trialing' | 'ended'
  current_period_ends_at: string | null
  cancel_at_period_end: boolean
  provider_customer_key: string | null
  provider_billing_key: string | null
}

type TossBillingResponse = {
  paymentKey?: string
  orderId?: string
  totalAmount?: number
  approvedAt?: string
  code?: string
  message?: string
}

type RenewMembershipResponse =
  | {
      ok: true
      processed: number
      renewed: number
      failed: number
      skipped: number
    }
  | { ok: false; error: string }

function unauthorized(): NextResponse<RenewMembershipResponse> {
  return NextResponse.json(
    { ok: false, error: 'unauthorized' },
    { status: 401 },
  )
}

async function readJson(response: Response): Promise<TossBillingResponse> {
  try {
    return (await response.json()) as TossBillingResponse
  } catch {
    return {}
  }
}

export async function POST(request: Request): Promise<Response> {
  const expected =
    process.env.MEMBERSHIP_RENEWAL_SECRET ?? process.env.CRON_SECRET ?? ''
  if (expected.length < 16 || !hasValidBearerToken(request.headers, expected)) {
    return unauthorized()
  }

  const admin = createAdminClient()
  if (!admin) {
    return NextResponse.json<RenewMembershipResponse>(
      { ok: false, error: 'Supabase service role 설정이 필요해요.' },
      { status: 500 },
    )
  }
  const adminDb = admin as unknown as UntypedSupabase

  const configResult = getTossPaymentConfig()
  if (!configResult.ok) {
    return NextResponse.json<RenewMembershipResponse>(
      { ok: false, error: configResult.error },
      { status: 500 },
    )
  }

  const now = new Date()
  const batchSize = Math.max(
    1,
    Math.min(
      50,
      Number.parseInt(process.env.MEMBERSHIP_RENEWAL_BATCH_SIZE ?? '20', 10) ||
        20,
    ),
  )

  const { data: memberships, error } = await adminDb
    .from('memberships')
    .select(
      [
        'id',
        'user_id',
        'status',
        'current_period_ends_at',
        'cancel_at_period_end',
        'provider_customer_key',
        'provider_billing_key',
      ].join(', '),
    )
    .in('status', ['active', 'past_due'])
    .lte('current_period_ends_at', now.toISOString())
    .order('current_period_ends_at', { ascending: true })
    .limit(batchSize)
    .returns<DueMembership[]>()

  if (error) {
    return NextResponse.json<RenewMembershipResponse>(
      { ok: false, error: '갱신 대상 멤버십을 가져오지 못했어요.' },
      { status: 500 },
    )
  }

  let renewed = 0
  let failed = 0
  let skipped = 0

  for (const membership of memberships ?? []) {
    if (
      !shouldRenewMembership(
        {
          status: membership.status,
          currentPeriodEndsAt: membership.current_period_ends_at,
          cancelAtPeriodEnd: membership.cancel_at_period_end,
          providerCustomerKey: membership.provider_customer_key,
          providerBillingKey: membership.provider_billing_key,
        },
        now,
      )
    ) {
      skipped += 1
      continue
    }

    const orderId = buildMembershipOrderId(membership.user_id)
    const amount = MEMBERSHIP_MONTHLY_AMOUNT_KRW

    const { error: orderError } = await adminDb
      .from('membership_payment_orders')
      .insert({
        user_id: membership.user_id,
        order_id: orderId,
        order_name: MEMBERSHIP_ORDER_NAME,
        amount,
        environment: configResult.config.environment,
        status: 'pending',
      })

    if (orderError) {
      failed += 1
      continue
    }

    const response = await fetch(
      `https://api.tosspayments.com/v1/billing/${membership.provider_billing_key}`,
      {
        method: 'POST',
        headers: {
          Authorization: buildTossBasicAuthorization(
            configResult.config.secretKey,
          ),
          'Content-Type': 'application/json',
          'Idempotency-Key': orderId,
        },
        body: JSON.stringify({
          customerKey: membership.provider_customer_key,
          amount,
          orderId,
          orderName: MEMBERSHIP_ORDER_NAME,
        }),
      },
    )

    const payload = await readJson(response)

    if (!response.ok) {
      const graceEndsAt = buildGraceEndsAt(now)

      await adminDb
        .from('membership_payment_orders')
        .update({
          status: 'failed',
          failure_code: payload.code ?? String(response.status),
          failure_message: payload.message ?? '자동결제를 승인하지 못했어요.',
          raw_response: payload as Json,
        })
        .eq('order_id', orderId)

      await adminDb
        .from('memberships')
        .update({
          status: 'past_due',
          grace_ends_at: graceEndsAt.toISOString(),
          last_payment_order_id: orderId,
        })
        .eq('id', membership.id)

      await createNotificationIfAllowed(adminDb, {
        userId: membership.user_id,
        kind: 'membership',
        title: '멤버십 결제를 확인해주세요',
        body: '자동결제가 완료되지 않아 잠시 유예 상태로 두었어요.',
        href: '/membership',
      })

      failed += 1
      continue
    }

    const period = resolveRenewalPeriod(
      membership.current_period_ends_at,
      now,
    )

    await adminDb
      .from('membership_payment_orders')
      .update({
        status: 'approved',
        payment_key: payload.paymentKey ?? null,
        approved_at: payload.approvedAt ?? now.toISOString(),
        raw_response: payload as Json,
      })
      .eq('order_id', orderId)

    await adminDb
      .from('memberships')
      .update({
        status: 'active',
        plan_key: MEMBERSHIP_PLAN_KEY,
        current_period_starts_at: period.startsAt.toISOString(),
        current_period_ends_at: period.endsAt.toISOString(),
        grace_ends_at: null,
        provider: 'toss',
        last_payment_order_id: orderId,
        last_payment_key: payload.paymentKey ?? null,
      })
      .eq('id', membership.id)

    await createNotificationIfAllowed(adminDb, {
      userId: membership.user_id,
      kind: 'membership',
      title: '멤버십이 이어졌어요',
      body: '이번 달에도 버디가 자기답게 일기를 남길 준비를 마쳤어요.',
      href: '/membership',
    })

    renewed += 1
  }

  return NextResponse.json<RenewMembershipResponse>({
    ok: true,
    processed: memberships?.length ?? 0,
    renewed,
    failed,
    skipped,
  })
}
