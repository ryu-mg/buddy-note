import 'server-only'

import type { SupabaseClient } from '@supabase/supabase-js'
import { revalidatePath } from 'next/cache'

import { MEMBERSHIP_PLAN_KEY } from '@/lib/billing/plan'
import {
  buildTossBasicAuthorization,
  getTossPaymentConfig,
  isPaymentAmountVerified,
} from '@/lib/billing/toss'
import { createNotificationIfAllowed } from '@/lib/notifications/delivery'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'

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
  approvedAt?: string
  code?: string
  message?: string
}

type UntypedSupabase = SupabaseClient

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

  const supabase = await createClient()
  if (!supabase) {
    return { ok: false, error: 'Supabase 설정이 필요해요.' }
  }

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return { ok: false, error: '로그인이 필요해요.' }
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

  if (!order || order.user_id !== user.id) {
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

  const payload = (await response.json()) as TossConfirmResponse

  if (!response.ok) {
    await adminDb
      .from('membership_payment_orders')
      .update({
        status: 'failed',
        payment_key: input.paymentKey,
        failure_code: payload.code ?? String(response.status),
        failure_message: payload.message ?? 'Toss Payments 승인이 실패했어요.',
        raw_response: payload,
      })
      .eq('order_id', input.orderId)

    return {
      ok: false,
      error: payload.message ?? '결제를 승인하지 못했어요.',
    }
  }

  const now = new Date()
  const periodEnd = new Date(now)
  periodEnd.setMonth(periodEnd.getMonth() + 1)

  await adminDb
    .from('membership_payment_orders')
    .update({
      status: 'approved',
      payment_key: payload.paymentKey ?? input.paymentKey,
      approved_at: payload.approvedAt ?? now.toISOString(),
      raw_response: payload,
    })
    .eq('order_id', input.orderId)

  await adminDb.from('memberships').upsert(
    {
      user_id: user.id,
      status: 'active',
      plan_key: MEMBERSHIP_PLAN_KEY,
      current_period_starts_at: now.toISOString(),
      current_period_ends_at: periodEnd.toISOString(),
      cancel_at_period_end: false,
      provider: 'toss',
      last_payment_order_id: input.orderId,
      last_payment_key: payload.paymentKey ?? input.paymentKey,
    },
    { onConflict: 'user_id' },
  )

  await createNotificationIfAllowed(adminDb, {
    userId: user.id,
    kind: 'membership',
    title: '멤버십이 열렸어요',
    body: '이제 일기 다시 쓰기, 글꼴 변경, 테마 변경을 사용할 수 있어요.',
    href: '/membership',
  })

  revalidatePath('/membership')
  revalidatePath('/pet')
  revalidatePath('/pet/theme')
  revalidatePath('/notifications')

  return { ok: true }
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
