import 'server-only'

import type { SupabaseClient } from '@supabase/supabase-js'

import { MEMBERSHIP_PLAN_KEY } from '@/lib/billing/plan'
import {
  buildTossBasicAuthorization,
  getTossPaymentConfig,
  isRecoverableApprovedTossPayment,
  isPaymentAmountVerified,
} from '@/lib/billing/toss'
import { createNotificationIfAllowed } from '@/lib/notifications/delivery'
import { createAdminClient } from '@/lib/supabase/admin'

type ConfirmMembershipPaymentInput = {
  paymentKey: string | null
  orderId: string | null
  amount: string | null
}

type ConfirmMembershipPaymentResult =
  | { ok: true }
  | { ok: false; error: string }

type PaymentOrder = {
  user_id: string
  amount: number
  status: string
}

type TossConfirmResponse = {
  paymentKey?: string
  orderId?: string
  totalAmount?: number
  status?: string
  approvedAt?: string
  code?: string
  message?: string
}

type UntypedSupabase = SupabaseClient

type ApproveMembershipPaymentInput = {
  userId: string
  orderId: string
  paymentKey: string
  approvedAt?: string | null
  rawResponse: TossConfirmResponse
}

async function readTossJson(response: Response): Promise<TossConfirmResponse> {
  try {
    return (await response.json()) as TossConfirmResponse
  } catch {
    return {}
  }
}

async function queryTossPayment({
  paymentKey,
  secretKey,
}: {
  paymentKey: string
  secretKey: string
}): Promise<TossConfirmResponse | null> {
  const response = await fetch(
    `https://api.tosspayments.com/v1/payments/${encodeURIComponent(paymentKey)}`,
    {
      method: 'GET',
      headers: {
        Authorization: buildTossBasicAuthorization(secretKey),
      },
    },
  )

  const payload = await readTossJson(response)
  return response.ok ? payload : null
}

async function approveMembershipPayment(
  adminDb: UntypedSupabase,
  input: ApproveMembershipPaymentInput,
): Promise<ConfirmMembershipPaymentResult> {
  const now = new Date()
  const periodEnd = new Date(now)
  periodEnd.setMonth(periodEnd.getMonth() + 1)

  const { error: orderUpdateError } = await adminDb
    .from('membership_payment_orders')
    .update({
      status: 'approved',
      payment_key: input.paymentKey,
      approved_at: input.approvedAt ?? now.toISOString(),
      failure_code: null,
      failure_message: null,
      raw_response: input.rawResponse,
    })
    .eq('order_id', input.orderId)

  if (orderUpdateError) {
    return {
      ok: false,
      error: '결제는 확인했지만 주문 상태를 저장하지 못했어요.',
    }
  }

  const { error: membershipError } = await adminDb.from('memberships').upsert(
    {
      user_id: input.userId,
      status: 'active',
      plan_key: MEMBERSHIP_PLAN_KEY,
      current_period_starts_at: now.toISOString(),
      current_period_ends_at: periodEnd.toISOString(),
      cancel_at_period_end: false,
      provider: 'toss',
      last_payment_order_id: input.orderId,
      last_payment_key: input.paymentKey,
    },
    { onConflict: 'user_id' },
  )

  if (membershipError) {
    return {
      ok: false,
      error: '결제는 확인했지만 멤버십을 저장하지 못했어요.',
    }
  }

  await createNotificationIfAllowed(adminDb, {
    userId: input.userId,
    kind: 'membership',
    title: '멤버십이 열렸어요',
    body: '이제 일기 다시 쓰기, 글꼴 변경, 테마 변경을 사용할 수 있어요.',
    href: '/membership',
  })

  return { ok: true }
}

export async function confirmMembershipPayment(
  input: ConfirmMembershipPaymentInput,
): Promise<ConfirmMembershipPaymentResult> {
  if (!input.paymentKey || !input.orderId || !input.amount) {
    return { ok: false, error: '결제 정보가 부족해요.' }
  }

  const amount = Number(input.amount)
  if (!Number.isInteger(amount) || amount <= 0) {
    return { ok: false, error: '결제 금액을 확인하지 못했어요.' }
  }

  const admin = createAdminClient()
  if (!admin) {
    return { ok: false, error: 'Supabase service role 설정이 필요해요.' }
  }
  const adminDb = admin as unknown as UntypedSupabase

  const { data: order } = await adminDb
    .from('membership_payment_orders')
    .select('user_id, amount, status')
    .eq('order_id', input.orderId)
    .maybeSingle<PaymentOrder>()

  if (!order) {
    return { ok: false, error: '결제 주문을 찾지 못했어요.' }
  }

  if (order.status === 'approved') {
    return { ok: true }
  }

  if (!isPaymentAmountVerified(order.amount, amount)) {
    await adminDb
      .from('membership_payment_orders')
      .update({
        status: 'failed',
        failure_code: 'AMOUNT_MISMATCH',
        failure_message: '저장된 금액과 승인 금액이 달라요.',
      })
      .eq('order_id', input.orderId)
    return { ok: false, error: '결제 금액이 달라서 승인하지 않았어요.' }
  }

  const configResult = getTossPaymentConfig()
  if (!configResult.ok) {
    return { ok: false, error: configResult.error }
  }

  const response = await fetch('https://api.tosspayments.com/v1/payments/confirm', {
    method: 'POST',
    headers: {
      Authorization: buildTossBasicAuthorization(configResult.config.secretKey),
      'Content-Type': 'application/json',
      'Idempotency-Key': input.orderId,
    },
    body: JSON.stringify({
      paymentKey: input.paymentKey,
      orderId: input.orderId,
      amount,
    }),
  })

  const payload = await readTossJson(response)

  if (!response.ok) {
    const queriedPayment = await queryTossPayment({
      paymentKey: input.paymentKey,
      secretKey: configResult.config.secretKey,
    })

    if (
      queriedPayment &&
      isRecoverableApprovedTossPayment(queriedPayment, {
        orderId: input.orderId,
        paymentKey: input.paymentKey,
        amount,
      })
    ) {
      return approveMembershipPayment(adminDb, {
        userId: order.user_id,
        orderId: input.orderId,
        paymentKey: queriedPayment.paymentKey ?? input.paymentKey,
        approvedAt: queriedPayment.approvedAt,
        rawResponse: queriedPayment,
      })
    }

    await adminDb
      .from('membership_payment_orders')
      .update({
        status: 'failed',
        payment_key: input.paymentKey,
        failure_code: payload.code ?? String(response.status),
        failure_message: payload.message ?? 'Toss Payments 승인이 실패했어요.',
        raw_response: {
          confirm: payload,
          query: queriedPayment,
        },
      })
      .eq('order_id', input.orderId)

    return {
      ok: false,
      error: payload.message ?? '결제를 승인하지 못했어요.',
    }
  }

  return approveMembershipPayment(adminDb, {
    userId: order.user_id,
    orderId: input.orderId,
    paymentKey: payload.paymentKey ?? input.paymentKey,
    approvedAt: payload.approvedAt,
    rawResponse: payload,
  })
}

export async function recordMembershipPaymentFailure({
  orderId,
  code,
  message,
}: {
  orderId: string | null
  code: string | null
  message: string | null
}): Promise<void> {
  if (!orderId) return
  const admin = createAdminClient()
  if (!admin) return
  const adminDb = admin as unknown as UntypedSupabase

  await adminDb
    .from('membership_payment_orders')
    .update({
      status: 'failed',
      failure_code: code,
      failure_message: message,
    })
    .eq('order_id', orderId)
}
