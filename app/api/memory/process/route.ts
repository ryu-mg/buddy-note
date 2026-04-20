import { NextResponse } from 'next/server'

import { createLogger } from '@/lib/logger'
import {
  DEFAULT_BATCH_SIZE,
  processQueueBatch,
} from '@/lib/memory/process-queue'
import { checkLimit, workerRatelimit } from '@/lib/rate-limit'

const log = createLogger('memory:route')

/**
 * Memory-updater worker endpoint.
 *
 * Invoked by pg_cron via pg_net every minute (see
 * supabase/migrations/20260420000003_memory_worker_cron.sql). Authenticated
 * with a shared `MEMORY_WORKER_SECRET` bearer token — this is an internal
 * worker, not a user-facing route, so the check is "is this our cron caller?"
 * rather than "who is this user?".
 *
 * runtime = 'nodejs'  : reuses lib/llm/generate-memory-summary.ts which relies
 *                       on the Anthropic SDK (Node-only, no Edge support).
 * maxDuration = 60    : 5-row batch × (LLM 5-15s + DB round-trips) can approach
 *                       a minute. Route Handler default on Vercel Hobby is 10s;
 *                       Pro allows 60. Batch size is configurable so we can
 *                       shrink it if we ever hit the ceiling.
 * dynamic = force-dynamic : never cache, always re-execute.
 */

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 60

/** architecture.md §9 policy: 실패해도 throw 대신 JSON body. */

type ErrorBody = { ok: false; error: string }

/**
 * timing-safe bearer compare. 시크릿은 랜덤 hex 이라 길이 차이 공격 표면이
 * 크진 않지만, header 가 장난 길이로 올 수 있으니 길이 불일치는 짧게 끊고
 * 같은 길이일 때만 문자별 비교 (early exit 없이).
 */
function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false
  let mismatch = 0
  for (let i = 0; i < a.length; i += 1) {
    mismatch |= a.charCodeAt(i) ^ b.charCodeAt(i)
  }
  return mismatch === 0
}

function unauthorized(reason: string): NextResponse<ErrorBody> {
  // 구체 원인은 log 에만, 응답은 일반화 (정찰 방지).
  log.warn('auth failed', { reason })
  return NextResponse.json<ErrorBody>(
    { ok: false, error: 'unauthorized' },
    { status: 401 },
  )
}

export async function POST(request: Request): Promise<Response> {
  const expected = process.env.MEMORY_WORKER_SECRET
  if (!expected || expected.length < 16) {
    // env 미설정은 route 자체를 사실상 비활성화. pg_cron 이 호출해도 401.
    return unauthorized('worker-secret-not-configured')
  }

  const authHeader = request.headers.get('authorization') ?? ''
  const match = authHeader.match(/^Bearer\s+(.+)$/i)
  if (!match) return unauthorized('missing-bearer')

  const provided = match[1].trim()
  if (!timingSafeEqual(provided, expected)) {
    return unauthorized('bearer-mismatch')
  }

  // Defensive rate limit — 글로벌 60/분. pg_cron 은 분당 1회지만 pg_net retry
  //  / 수동 트리거 / 장애 복구 중 쌓인 호출이 한꺼번에 터지는 상황에서
  //  LLM 비용이 폭발하는 걸 막는다. stub 모드에서는 통과.
  const rl = await checkLimit(workerRatelimit, 'global')
  if (!rl.allowed) {
    return NextResponse.json<ErrorBody>(
      { ok: false, error: 'worker over capacity' },
      { status: 429 },
    )
  }

  // Batch size는 env로 override 가능. 값이 이상하면 default 로 fallback.
  const parsedBatch = Number.parseInt(
    process.env.MEMORY_WORKER_BATCH_SIZE ?? '',
    10,
  )
  const batchSize =
    Number.isFinite(parsedBatch) && parsedBatch > 0
      ? parsedBatch
      : DEFAULT_BATCH_SIZE

  const response = await processQueueBatch({ batchSize })

  if (!response.ok) {
    // env 미설정 또는 claim RPC 실패 — 500 으로 돌려보낸다 (pg_cron 은 body 를
    // cron.job_run_details.return_message 로 기록하므로 원인이 남음).
    log.error('batch failed', { response })
    return NextResponse.json<ErrorBody>(
      { ok: false, error: response.error },
      { status: 500 },
    )
  }

  return NextResponse.json(
    { ok: true, ...response.result },
    { status: 200 },
  )
}
