import 'server-only'

import { SupabaseClient } from '@supabase/supabase-js'

import { generateMemorySummary } from '@/lib/llm/generate-memory-summary'
import type {
  MemoryLogInput,
  PreviousSummaryInput,
  RecentCallback,
} from '@/lib/llm/memory-schemas'
import { createAdminClient } from '@/lib/supabase/admin'

/**
 * pg_cron → /api/memory/process → this module.
 *
 * architecture.md §9 파이프라인을 Node 런타임에서 실행한다. 핵심 책임 3가지:
 *   1. `claim_memory_queue_batch` RPC 로 대기 중인 큐 row 를 원자적으로 claim.
 *   2. 각 row 에 대해 per-pet 세션 advisory lock → generateMemorySummary →
 *      optimistic-version UPSERT.
 *   3. 상태 전이는 전부 `mark_queue_{done,failed,retry}` RPC 경유 (state
 *      machine 을 SQL 한 곳에 모아둠).
 *
 * 이 모듈은 순수 함수처럼 동작한다 — request/response 객체를 받지 않고
 * 결과 카운트만 반환. Route Handler 가 auth + JSON wrapping 만 담당.
 */

// -----------------------------------------------------------------------------
// Config
// -----------------------------------------------------------------------------

/** 한 번에 처리할 큐 row 상한. 너무 크면 Route Handler 가 maxDuration 에 걸림. */
export const DEFAULT_BATCH_SIZE = 5

/** `claim_memory_queue_batch` 의 attempts 가 이 값 이상이면 failed 로 종료. */
const MAX_ATTEMPTS = 3

/** generateMemorySummary 에 넘길 새 로그 상한 (스키마도 max 20 으로 가드). */
const MAX_NEW_LOGS = 20

// -----------------------------------------------------------------------------
// Types
// -----------------------------------------------------------------------------

export type ProcessQueueBatchOptions = {
  batchSize?: number
}

export type ProcessQueueBatchResult = {
  processed: number
  succeeded: number
  failed: number
  skipped: number
}

export type ProcessQueueBatchError =
  | { ok: false; code: 'env'; error: string }
  | { ok: false; code: 'rpc'; error: string }

export type ProcessQueueBatchResponse =
  | { ok: true; result: ProcessQueueBatchResult }
  | ProcessQueueBatchError

type ClaimedRow = {
  queue_id: number
  pet_id: string
  log_id: string
  attempts: number
}

type PetRow = {
  id: string
  name: string
  breed: string | null
  persona_prompt_fragment: string | null
}

type PreviousSummaryRow = {
  tone_description: string | null
  recurring_habits: string[]
  favorite_things: string[]
  recent_callbacks: unknown
  version: number
  updated_at: string
}

type LogWithDiaryRow = {
  created_at: string
  tags: string[] | null
  memo: string | null
  diaries:
    | { title: string | null; body: string | null }
    | { title: string | null; body: string | null }[]
    | null
}

// -----------------------------------------------------------------------------
// Helpers
// -----------------------------------------------------------------------------

/**
 * `pet_memory_summary.recent_callbacks` 는 jsonb 라 런타임에선 unknown.
 * 스키마 (memory-schemas.ts) 와 같은 shape 인지 best-effort 로 검사.
 * 실패해도 이전 상태 전체를 폐기하지 않도록 빈 배열로만 대체한다.
 */
function coerceRecentCallbacks(raw: unknown): RecentCallback[] {
  if (!Array.isArray(raw)) return []
  const result: RecentCallback[] = []
  for (const item of raw) {
    if (
      item &&
      typeof item === 'object' &&
      typeof (item as { note?: unknown }).note === 'string' &&
      ((item as { source?: unknown }).source === 'log' ||
        (item as { source?: unknown }).source === 'diary') &&
      typeof (item as { referenceDate?: unknown }).referenceDate === 'string'
    ) {
      result.push(item as RecentCallback)
    }
  }
  return result
}

/**
 * supabase-js 의 nested select `.diaries(...)` 는 FK 관계에 따라 object 나
 * array 로 온다. 1:1 (log_id UNIQUE) 라 하나만 있으면 충분.
 */
function pickDiary(rel: LogWithDiaryRow['diaries']): {
  title: string | null
  body: string | null
} | null {
  if (!rel) return null
  if (Array.isArray(rel)) return rel[0] ?? null
  return rel
}

/**
 * 로그 행들을 `MemorySummaryInput.newLogs` 모양으로 변환.
 * createdAt 오름차순은 호출측 쿼리에서 이미 보장.
 */
function toMemoryLogInputs(rows: LogWithDiaryRow[]): MemoryLogInput[] {
  return rows.slice(0, MAX_NEW_LOGS).map((row) => {
    const diary = pickDiary(row.diaries)
    return {
      createdAt: row.created_at,
      tags: row.tags ?? [],
      memo: row.memo ?? null,
      diaryTitle: diary?.title ?? null,
      diaryBody: diary?.body ?? null,
    }
  })
}

function toPreviousSummary(row: PreviousSummaryRow | null): {
  previous: PreviousSummaryInput | null
  version: number | null
  updatedAt: string | null
} {
  if (!row) return { previous: null, version: null, updatedAt: null }
  return {
    previous: {
      tone_description: row.tone_description,
      recurring_habits: row.recurring_habits ?? [],
      favorite_things: row.favorite_things ?? [],
      recent_callbacks: coerceRecentCallbacks(row.recent_callbacks),
    },
    version: row.version,
    updatedAt: row.updated_at,
  }
}

// -----------------------------------------------------------------------------
// Single-row processing
// -----------------------------------------------------------------------------

type RowOutcome = 'succeeded' | 'failed' | 'skipped'

/**
 * 한 큐 row 를 처리한다. 어떤 경우에도 throw 하지 않음 — 상위 배치 루프가
 * 뒷정리를 놓치는 일이 없어야 한다. 실패 원인은 `mark_queue_{failed,retry}`
 * 의 `last_error` 로 기록해 관측 가능하게 남긴다.
 */
async function processOneRow(
  admin: SupabaseClient,
  row: ClaimedRow,
): Promise<RowOutcome> {
  const { queue_id, pet_id, attempts } = row

  // Pet 메타 조회
  const { data: petData, error: petError } = await admin
    .from('pets')
    .select('id, name, breed, persona_prompt_fragment')
    .eq('id', pet_id)
    .maybeSingle()

  if (petError) {
    // DB 조회 실패는 transient 로 간주하고 재시도 예산 쓰게 한다.
    const retryable = attempts < MAX_ATTEMPTS
    await admin.rpc(retryable ? 'mark_queue_retry' : 'mark_queue_failed', {
      p_queue_id: queue_id,
      p_error: `pet-fetch-error: ${petError.message}`.slice(0, 500),
    })
    return retryable ? 'skipped' : 'failed'
  }

  if (!petData) {
    // pet 이 삭제됐으면 큐 row 는 더 이상 의미 없음 → terminal failed.
    await admin.rpc('mark_queue_failed', {
      p_queue_id: queue_id,
      p_error: 'pet-not-found',
    })
    return 'failed'
  }
  const pet = petData as PetRow

  // Advisory lock: 같은 pet 의 다른 row 가 처리 중이면 양보한다.
  // `lockAcquired === false` 일 때만 retry — rpc 자체가 실패하면 그것도
  // transient 로 보고 retry (lock 잔존은 없음 — pg_try_advisory_lock 은
  // 실제로 잡혔을 때만 true 를 돌려줌).
  const { data: lockAcquired, error: lockError } = await admin.rpc(
    'try_advisory_lock_pet',
    { p_pet_id: pet.id },
  )

  if (lockError) {
    await admin.rpc('mark_queue_retry', {
      p_queue_id: queue_id,
      p_error: `lock-rpc-error: ${lockError.message}`.slice(0, 500),
    })
    return 'skipped'
  }

  if (lockAcquired !== true) {
    // 다른 워커가 이 펫을 잡고 있음 → 다음 tick 으로 미룸.
    await admin.rpc('mark_queue_retry', {
      p_queue_id: queue_id,
      p_error: 'advisory-lock-busy',
    })
    return 'skipped'
  }

  try {
    // 이전 summary 조회
    const { data: prevRaw, error: prevError } = await admin
      .from('pet_memory_summary')
      .select(
        'tone_description, recurring_habits, favorite_things, recent_callbacks, version, updated_at',
      )
      .eq('pet_id', pet.id)
      .maybeSingle()

    if (prevError) {
      const retryable = attempts < MAX_ATTEMPTS
      await admin.rpc(retryable ? 'mark_queue_retry' : 'mark_queue_failed', {
        p_queue_id: queue_id,
        p_error: `summary-fetch-error: ${prevError.message}`.slice(0, 500),
      })
      return retryable ? 'skipped' : 'failed'
    }

    const prevInfo = toPreviousSummary(
      (prevRaw as PreviousSummaryRow | null) ?? null,
    )
    // 처음 갱신이면 epoch 부터, 아니면 마지막 updated_at 이후 로그만.
    const since = prevInfo.updatedAt ?? '1970-01-01T00:00:00.000Z'

    // 새 로그 조회 (diary 1:1 join)
    const { data: logsRaw, error: logsError } = await admin
      .from('logs')
      .select('created_at, tags, memo, diaries(title, body)')
      .eq('pet_id', pet.id)
      .gt('created_at', since)
      .order('created_at', { ascending: true })
      .limit(MAX_NEW_LOGS)

    if (logsError) {
      const retryable = attempts < MAX_ATTEMPTS
      await admin.rpc(retryable ? 'mark_queue_retry' : 'mark_queue_failed', {
        p_queue_id: queue_id,
        p_error: `logs-fetch-error: ${logsError.message}`.slice(0, 500),
      })
      return retryable ? 'skipped' : 'failed'
    }

    const newLogs = toMemoryLogInputs(
      (logsRaw as LogWithDiaryRow[] | null) ?? [],
    )

    if (newLogs.length === 0) {
      // 이미 다른 tick 이 집어삼켰거나 로그가 사라진 상태. 깔끔한 no-op.
      await admin.rpc('mark_queue_done', { p_queue_id: queue_id })
      return 'succeeded'
    }

    // LLM 호출 — generateMemorySummary 는 throw 하지 않는 계약. fallback 도
    // ok:true + isFallback:true 로 온다.
    const summaryResult = await generateMemorySummary({
      petName: pet.name,
      breed: pet.breed ?? undefined,
      personaFragment: pet.persona_prompt_fragment ?? pet.name,
      previousSummary: prevInfo.previous ?? undefined,
      newLogs,
    })

    if (summaryResult.meta.isFallback) {
      // fallback 은 이전 summary 보존이 valid terminal state (architecture.md §9).
      // 불필요하게 재시도해서 API 비용 태우지 않는다. 다음 log insert 가 새
      // 큐 row 를 만들 때 다시 시도됨.
      await admin.rpc('mark_queue_done', { p_queue_id: queue_id })
      return 'succeeded'
    }

    // 성공: DB 컬럼명 (snake_case) 으로 매핑
    const nextPayload = {
      tone_description: summaryResult.data.toneDescription,
      recurring_habits: summaryResult.data.recurringHabits,
      favorite_things: summaryResult.data.favoriteThings,
      recent_callbacks: summaryResult.data
        .recentCallbacks as unknown as RecentCallback[],
    }

    if (prevInfo.version === null) {
      // 첫 summary — 그냥 insert. version 기본값 1.
      const { error: insertError } = await admin
        .from('pet_memory_summary')
        .insert({
          pet_id: pet.id,
          ...nextPayload,
        })

      if (insertError) {
        // unique violation (다른 워커가 먼저 insert) → retry 로 두면 다음 tick 에
        // update 경로를 탄다.
        const retryable = attempts < MAX_ATTEMPTS
        await admin.rpc(retryable ? 'mark_queue_retry' : 'mark_queue_failed', {
          p_queue_id: queue_id,
          p_error: `summary-insert-error: ${insertError.message}`.slice(0, 500),
        })
        return retryable ? 'skipped' : 'failed'
      }
    } else {
      // Optimistic version bump — 다른 워커가 그 사이에 업데이트했으면
      // update 가 0 row 를 건드리고 `data` 는 null 이 된다.
      const { data: updated, error: updateError } = await admin
        .from('pet_memory_summary')
        .update({
          ...nextPayload,
          version: prevInfo.version + 1,
        })
        .eq('pet_id', pet.id)
        .eq('version', prevInfo.version)
        .select('pet_id')
        .maybeSingle()

      if (updateError) {
        const retryable = attempts < MAX_ATTEMPTS
        await admin.rpc(retryable ? 'mark_queue_retry' : 'mark_queue_failed', {
          p_queue_id: queue_id,
          p_error: `summary-update-error: ${updateError.message}`.slice(0, 500),
        })
        return retryable ? 'skipped' : 'failed'
      }

      if (!updated) {
        // 다른 워커가 먼저 bump — 이번 결과는 stale. 다음 tick 에 새 prev 로
        // 다시 계산하면 됨. 재시도 비용이 낮으므로 done 대신 retry.
        const retryable = attempts < MAX_ATTEMPTS
        await admin.rpc(retryable ? 'mark_queue_retry' : 'mark_queue_failed', {
          p_queue_id: queue_id,
          p_error: 'optimistic-version-conflict',
        })
        return retryable ? 'skipped' : 'failed'
      }
    }

    await admin.rpc('mark_queue_done', { p_queue_id: queue_id })
    return 'succeeded'
  } catch (err) {
    // 예측 못 한 예외 — 남은 retry 예산 쓰게 두고 뒤 tick 에 다시 시도.
    const reason = err instanceof Error ? err.message : 'unknown'
    const retryable = attempts < MAX_ATTEMPTS
    await admin.rpc(retryable ? 'mark_queue_retry' : 'mark_queue_failed', {
      p_queue_id: queue_id,
      p_error: `unhandled: ${reason}`.slice(0, 500),
    })
    return retryable ? 'skipped' : 'failed'
  } finally {
    // ★ 반드시 release — RPC 자체가 실패해도 fire-and-forget 으로 호출.
    // 세션이 끊기면 Postgres 가 advisory lock 을 자동 해제하지만, 한 request
    // 안에서 여러 row 를 연달아 처리하려면 명시 해제가 필수.
    try {
      const { error: releaseError } = await admin.rpc(
        'release_advisory_lock_pet',
        { p_pet_id: pet.id },
      )
      if (releaseError) {
        console.error(
          '[processOneRow] advisory lock release failed:',
          releaseError.message,
        )
      }
    } catch (releaseErr) {
      console.error(
        '[processOneRow] advisory lock release threw:',
        releaseErr instanceof Error ? releaseErr.message : releaseErr,
      )
    }
  }
}

// -----------------------------------------------------------------------------
// Batch entry point
// -----------------------------------------------------------------------------

/**
 * pg_cron 이 1분마다 호출한다. Route Handler 는 여기 반환값을 그대로 JSON 으로
 * 싸서 내보낸다.
 */
export async function processQueueBatch(
  options: ProcessQueueBatchOptions = {},
): Promise<ProcessQueueBatchResponse> {
  const batchSize = Math.max(1, options.batchSize ?? DEFAULT_BATCH_SIZE)

  const adminTyped = createAdminClient()
  if (!adminTyped) {
    return {
      ok: false,
      code: 'env',
      error: 'Supabase service-role env missing',
    }
  }
  // types/database.ts 의 Functions 제약 회피 — app/log/actions.ts 와 동일 패턴.
  const admin = adminTyped as unknown as SupabaseClient

  const { data: claimedRaw, error: claimError } = await admin.rpc(
    'claim_memory_queue_batch',
    { p_batch_size: batchSize },
  )

  if (claimError) {
    return {
      ok: false,
      code: 'rpc',
      error: `claim_memory_queue_batch failed: ${claimError.message}`,
    }
  }

  const claimed = (claimedRaw as ClaimedRow[] | null) ?? []

  let succeeded = 0
  let failed = 0
  let skipped = 0

  for (const row of claimed) {
    const outcome = await processOneRow(admin, row)
    if (outcome === 'succeeded') succeeded += 1
    else if (outcome === 'failed') failed += 1
    else skipped += 1
  }

  return {
    ok: true,
    result: {
      processed: claimed.length,
      succeeded,
      failed,
      skipped,
    },
  }
}
