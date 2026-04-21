import { describe, expect, it } from 'bun:test'

import { checkLimit, createStubLimiter } from '@/lib/rate-limit-core'

describe('checkLimit', () => {
  it('limiter success=true를 allowed=true로 표준화한다', async () => {
    const result = await checkLimit(
      {
        async limit(identifier: string) {
          expect(identifier).toBe('user-1')
          return {
            success: true,
            limit: 10,
            remaining: 9,
            reset: 123,
          }
        },
      },
      'user-1',
    )

    expect(result.allowed).toBe(true)
    expect(result.remaining).toBe(9)
    expect(result.resetAt).toBe(123)
    expect(result.isStub).toBe(false)
  })

  it('limiter success=false를 allowed=false로 표준화한다', async () => {
    const result = await checkLimit(
      {
        async limit() {
          return {
            success: false,
            limit: 10,
            remaining: 0,
            reset: 456,
          }
        },
      },
      'user-2',
    )

    expect(result.allowed).toBe(false)
    expect(result.remaining).toBe(0)
    expect(result.resetAt).toBe(456)
    expect(result.isStub).toBe(false)
  })

  it('stub limiter는 isStub=true로 통과한다', async () => {
    const result = await checkLimit(createStubLimiter(), 'user-3')
    expect(result.allowed).toBe(true)
    expect(result.remaining).toBe(Number.POSITIVE_INFINITY)
    expect(result.isStub).toBe(true)
    expect(result.resetAt).toBeGreaterThan(0)
  })
})
