import { describe, expect, it } from 'bun:test'

import {
  buildMembershipOrderId,
  buildTossBasicAuthorization,
  getTossPaymentConfig,
  isPaymentAmountVerified,
} from '@/lib/billing/toss'

describe('toss payment config', () => {
  it('uses test keys by default', () => {
    const result = getTossPaymentConfig({
      TOSS_PAYMENTS_TEST_CLIENT_KEY: 'test_ck_x',
      TOSS_PAYMENTS_TEST_SECRET_KEY: 'test_sk_x',
    })

    expect(result).toEqual({
      ok: true,
      config: {
        environment: 'test',
        clientKey: 'test_ck_x',
        secretKey: 'test_sk_x',
      },
    })
  })

  it('requires live secret keys in live mode', () => {
    const result = getTossPaymentConfig({
      TOSS_PAYMENTS_ENV: 'live',
      TOSS_PAYMENTS_LIVE_CLIENT_KEY: 'live_ck_x',
      TOSS_PAYMENTS_LIVE_SECRET_KEY: 'test_sk_wrong',
    })

    expect(result.ok).toBe(false)
  })

  it('builds Basic authorization from secret key plus colon', () => {
    expect(buildTossBasicAuthorization('test_sk_sample')).toBe(
      'Basic dGVzdF9za19zYW1wbGU6',
    )
  })

  it('creates Toss-compatible order ids and verifies approved amount', () => {
    expect(buildMembershipOrderId('user-123').length).toBeLessThanOrEqual(64)
    expect(isPaymentAmountVerified(4900, 4900)).toBe(true)
    expect(isPaymentAmountVerified(4900, 100)).toBe(false)
  })
})
