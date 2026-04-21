type LimitResult = {
  success: boolean
  limit: number
  remaining: number
  reset: number
}

export type Limiter = {
  limit: (identifier: string) => Promise<LimitResult>
  readonly isStub?: true
}

export type CheckLimitResult = {
  allowed: boolean
  remaining: number
  /** epoch millis — sliding window 리셋 예상 시각 */
  resetAt: number
  /** Upstash 미설정으로 bypass 됐으면 true (dev 식별용) */
  isStub: boolean
}

/**
 * Stub Ratelimit-like shape. 진짜 Ratelimit 타입을 모두 흉내낼 필요 없이
 * `limit()` 만 쓰므로 최소 인터페이스만 맞춘다.
 */
export function createStubLimiter(): Limiter {
  return {
    isStub: true,
    async limit(): Promise<LimitResult> {
      return {
        success: true,
        limit: Number.POSITIVE_INFINITY,
        remaining: Number.POSITIVE_INFINITY,
        reset: Date.now(),
      }
    },
  }
}

/**
 * Ratelimit 결과를 표준화. UI/로그가 어느 limiter 든 동일 shape 으로 처리.
 */
export async function checkLimit(
  limiter: Limiter,
  identifier: string,
): Promise<CheckLimitResult> {
  const result = await limiter.limit(identifier)
  return {
    allowed: result.success,
    remaining: result.remaining,
    resetAt: result.reset,
    isStub: limiter.isStub === true,
  }
}
