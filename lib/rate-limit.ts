import 'server-only'

import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

import {
  checkLimit,
  createStubLimiter,
  type CheckLimitResult,
  type Limiter,
} from '@/lib/rate-limit-core'

/**
 * Rate limiting — architecture.md §8.
 *
 * Upstash Redis (REST) + sliding-window. 세 가지 용도:
 *   - diaryRatelimit : 유저당 시간당 10 일기 생성 (AGENTS.md "유저당 시간당 10 기록")
 *   - workerRatelimit: /api/memory/process 글로벌 60/분 (belt-and-suspenders;
 *                      pg_cron 은 분당 1회지만 실수/재진입 시 과호출 방지)
 *   - authRatelimit  : 매직링크 발송 이메일당 5/15분 (v1에서는 미사용, 준비만)
 *
 * Env 미설정 시 (dev 환경) stub 모드: 모든 limit 호출이 통과한다.
 * `checkLimit` 결과의 `isStub=true` 로 호출자가 식별할 수 있음.
 */

const url = process.env.UPSTASH_REDIS_REST_URL
const token = process.env.UPSTASH_REDIS_REST_TOKEN

/**
 * Lazily constructed Redis client — env 없으면 null. 모든 limiter factory 가
 * 같은 guard 를 통과하므로, 한 번의 null check 로 전체 stub 모드가 결정된다.
 */
const redis = url && token ? new Redis({ url, token }) : null

const STUB = createStubLimiter()

function makeLimiter(
  count: number,
  window: Parameters<typeof Ratelimit.slidingWindow>[1],
  prefix: string,
): Limiter {
  if (!redis) return STUB
  return new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(count, window),
    analytics: true,
    prefix,
  })
}

/** 유저당 시간당 10 일기 생성 (AGENTS.md policy). */
export const diaryRatelimit: Limiter = makeLimiter(10, '1 h', 'rl:diary')

/**
 * /api/memory/process 글로벌 버짓. pg_cron 은 1/분 이지만 수동 트리거나
 * retry 가 누적될 경우를 대비한 안전장치. per-user 가 아니므로 identifier
 * 는 `'global'` 고정 (호출부에서).
 */
export const workerRatelimit: Limiter = makeLimiter(60, '1 m', 'rl:worker')

/**
 * 매직링크 발송 — 이메일당 5/15분. v1 에서는 wire up 하지 않지만 export 만
 * 해둔다 (auth action 추가될 때 import).
 */
export const authRatelimit: Limiter = makeLimiter(5, '15 m', 'rl:auth')

export { checkLimit, type CheckLimitResult }
