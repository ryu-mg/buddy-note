'use server'

import type { SupabaseClient } from '@supabase/supabase-js'

import {
  MEMBERSHIP_MONTHLY_AMOUNT_KRW,
  MEMBERSHIP_ORDER_NAME,
} from '@/lib/billing/plan'
import {
  buildMembershipOrderId,
  buildTossBasicAuthorization,
  getTossPaymentConfig,
} from '@/lib/billing/toss'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'

type CreateMembershipCheckoutResult =
  | { ok: true; checkoutUrl: string }
  | { ok: false; error: string; code?: 'auth' | 'db' | 'payment' }

type TossCreatePaymentResponse = {
  checkout?: {
    url?: string
  }
  code?: string
  message?: string
}

type UntypedSupabase = SupabaseClient

export async function createMembershipCheckout(): Promise<CreateMembershipCheckoutResult> {
  const supabase = await createClient()
  if (!supabase) {
    return {
      ok: false,
      error: 'Supabase 설정이 필요해요. 관리자에게 문의해주세요.',
      code: 'db',
    }
  }

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return { ok: false, error: '로그인이 필요해요.', code: 'auth' }
  }

  const admin = createAdminClient()
  if (!admin) {
    return {
      ok: false,
      error: 'Supabase service role 설정이 필요해요.',
      code: 'db',
    }
  }
  const adminDb = admin as unknown as UntypedSupabase

  const configResult = getTossPaymentConfig()
  if (!configResult.ok) {
    return { ok: false, error: configResult.error, code: 'payment' }
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:4000'
  const orderId = buildMembershipOrderId(user.id)
  const amount = MEMBERSHIP_MONTHLY_AMOUNT_KRW

  const { error: insertError } = await adminDb
    .from('membership_payment_orders')
    .insert({
      user_id: user.id,
      order_id: orderId,
      order_name: MEMBERSHIP_ORDER_NAME,
      amount,
      environment: configResult.config.environment,
      status: 'pending',
    })

  if (insertError) {
    return {
      ok: false,
      error: '결제 주문을 준비하지 못했어요. 잠시 후 다시 시도해주세요.',
      code: 'db',
    }
  }

  const response = await fetch('https://api.tosspayments.com/v1/payments', {
    method: 'POST',
    headers: {
      Authorization: buildTossBasicAuthorization(configResult.config.secretKey),
      'Content-Type': 'application/json',
      'Idempotency-Key': orderId,
    },
    body: JSON.stringify({
      method: 'CARD',
      amount,
      currency: 'KRW',
      orderId,
      orderName: MEMBERSHIP_ORDER_NAME,
      successUrl: `${siteUrl}/membership/success`,
      failUrl: `${siteUrl}/membership/fail`,
      flowMode: 'DIRECT',
      easyPay: 'TOSSPAY',
    }),
  })

  const payload = (await response.json()) as TossCreatePaymentResponse
  const checkoutUrl = payload.checkout?.url

  if (!response.ok || !checkoutUrl) {
    await adminDb
      .from('membership_payment_orders')
      .update({
        status: 'failed',
        failure_code: payload.code ?? String(response.status),
        failure_message:
          payload.message ?? 'Toss Payments 결제창을 만들지 못했어요.',
        raw_response: payload,
      })
      .eq('order_id', orderId)

    return {
      ok: false,
      error:
        payload.message ?? '결제창을 열지 못했어요. 잠시 후 다시 시도해주세요.',
      code: 'payment',
    }
  }

  await adminDb
    .from('membership_payment_orders')
    .update({
      status: 'ready',
      checkout_url: checkoutUrl,
      raw_response: payload,
    })
    .eq('order_id', orderId)

  return { ok: true, checkoutUrl }
}
