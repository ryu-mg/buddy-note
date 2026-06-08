import { randomUUID } from 'node:crypto'

import type { PaymentEnvironment } from '@/types/database'

export type TossPaymentConfig = {
  environment: PaymentEnvironment
  clientKey: string
  secretKey: string
}

export type TossPaymentConfigResult =
  | { ok: true; config: TossPaymentConfig }
  | { ok: false; error: string }

export type TossEnv = Partial<Record<string, string | undefined>>

export type RecoverableTossPayment = {
  status?: string
  orderId?: string
  paymentKey?: string
  totalAmount?: number
}

export type ExpectedTossPayment = {
  orderId: string
  paymentKey: string
  amount: number
}

export function getTossPaymentConfig(
  env: TossEnv = process.env,
): TossPaymentConfigResult {
  const environment = env.TOSS_PAYMENTS_ENV === 'live' ? 'live' : 'test'
  const clientKey =
    environment === 'live'
      ? env.TOSS_PAYMENTS_LIVE_CLIENT_KEY
      : env.TOSS_PAYMENTS_TEST_CLIENT_KEY
  const secretKey =
    environment === 'live'
      ? env.TOSS_PAYMENTS_LIVE_SECRET_KEY
      : env.TOSS_PAYMENTS_TEST_SECRET_KEY

  if (!clientKey || !secretKey) {
    return {
      ok: false,
      error:
        'Toss Payments 키가 필요해요. .env.local에 테스트/실결제 키를 채워주세요.',
    }
  }

  const expectedSecretPrefix = environment === 'live' ? 'live_' : 'test_'
  if (!secretKey.startsWith(expectedSecretPrefix)) {
    return {
      ok: false,
      error:
        environment === 'live'
          ? '실결제 환경에는 live_ 시크릿 키가 필요해요.'
          : '개발 결제 환경에는 test_ 시크릿 키가 필요해요.',
    }
  }

  return {
    ok: true,
    config: {
      environment,
      clientKey,
      secretKey,
    },
  }
}

export function buildTossBasicAuthorization(secretKey: string): string {
  return `Basic ${Buffer.from(`${secretKey}:`).toString('base64')}`
}

export function buildMembershipOrderId(userId: string): string {
  const userPart = userId.replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 12)
  const idPart = randomUUID().replaceAll('-', '')
  return `bn_${userPart}_${idPart}`.slice(0, 64)
}

export function isPaymentAmountVerified(
  requestedAmount: number,
  approvedAmount: number,
): boolean {
  return Number.isInteger(requestedAmount) && requestedAmount === approvedAmount
}

export function isRecoverableApprovedTossPayment(
  payment: RecoverableTossPayment,
  expected: ExpectedTossPayment,
): boolean {
  return (
    payment.status === 'DONE' &&
    payment.orderId === expected.orderId &&
    payment.paymentKey === expected.paymentKey &&
    typeof payment.totalAmount === 'number' &&
    isPaymentAmountVerified(expected.amount, payment.totalAmount)
  )
}
