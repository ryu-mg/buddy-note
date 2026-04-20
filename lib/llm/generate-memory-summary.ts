import 'server-only'

import { DIARY_MODEL, getAnthropic } from '@/lib/llm/client'
import {
  MEMORY_SUMMARY_PROMPT_VERSION,
  MEMORY_SUMMARY_SYSTEM_PROMPT_V1,
} from '@/lib/llm/memory-prompts'
import {
  memorySummaryInputSchema,
  memorySummarySchema,
  type MemorySummaryInput,
  type MemorySummaryOutput,
  type PreviousSummaryInput,
} from '@/lib/llm/memory-schemas'

/**
 * `pet_memory_summary` 갱신 결과.
 *
 * `generateDiary` 와 동일하게 **항상 success shape** — LLM 호출이 실패해도
 * fallback 으로 승급해 호출측 (pg_cron worker / Edge Function) 이 큐 row 를
 * `done` 으로 마무리할 수 있게 한다 (architecture.md §9 async pipeline).
 *
 * Optimistic lock 충돌이 났을 때의 재시도는 호출측 책임. 이 함수는 "이번 컨텍스트
 * 기준으로 새 summary 를 한 번 만들어줘" 만 한다.
 */
export type MemorySummaryMeta = {
  /**
   * `model_used` 컬럼에 그대로 들어갈 태그.
   * 성공 시 `claude-sonnet-4-5@memory-summary-v1`, fallback 시 `fallback@memory-summary-v1`.
   */
  modelUsed: string
  latencyMs: number
  tokensInput: number
  tokensOutput: number
  isFallback: boolean
  /** 디버깅용. UI 노출 금지. */
  fallbackReason?: string
}

export type MemorySummaryResult = {
  ok: true
  data: MemorySummaryOutput
  meta: MemorySummaryMeta
}

const MAX_OUTPUT_TOKENS = 1500

// -------------------------------------------------------------
// Fallback
// -------------------------------------------------------------

/**
 * `previousSummary` 가 있으면 그것을 contract 형태 (camelCase) 로 그대로 통과,
 * 없으면 모든 필드를 빈 값으로 시드한다. **압축 누적 자산**이라 함부로 비우면
 * 안 됨 — 이전 상태 보존이 항상 우선 (architecture.md §9 "비용 절감" 참조).
 */
function buildFallbackOutput(
  previous: PreviousSummaryInput | null | undefined,
): MemorySummaryOutput {
  if (!previous) {
    return {
      toneDescription: '',
      recurringHabits: [],
      favoriteThings: [],
      recentCallbacks: [],
    }
  }
  return {
    toneDescription: previous.tone_description ?? '',
    recurringHabits: previous.recurring_habits,
    favoriteThings: previous.favorite_things,
    recentCallbacks: previous.recent_callbacks,
  }
}

function fallbackResult(
  previous: PreviousSummaryInput | null | undefined,
  reason: string,
  startMs: number,
): MemorySummaryResult {
  return {
    ok: true,
    data: buildFallbackOutput(previous),
    meta: {
      modelUsed: `fallback@${MEMORY_SUMMARY_PROMPT_VERSION}`,
      latencyMs: Date.now() - startMs,
      tokensInput: 0,
      tokensOutput: 0,
      isFallback: true,
      fallbackReason: reason,
    },
  }
}

// -------------------------------------------------------------
// JSON parse helper
// -------------------------------------------------------------

/**
 * 모델 응답에서 code fence 가 섞여 들어오는 경우를 관용적으로 처리한 뒤 JSON
 * 파싱을 시도한다. 성공하면 unknown, 실패하면 null. (generate-diary.ts 와 동일 패턴)
 */
function tryParseJson(raw: string): unknown {
  const trimmed = raw.trim()
  const fenceStripped = trimmed
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```$/i, '')
    .trim()
  try {
    return JSON.parse(fenceStripped)
  } catch {
    return null
  }
}

// -------------------------------------------------------------
// Public API
// -------------------------------------------------------------

/**
 * 직전 summary 와 새 로그들을 받아 새 `pet_memory_summary` 페이로드를 만든다.
 *
 * 호출 흐름 (architecture.md §9):
 *   pg_cron worker → advisory lock per pet_id → 이 함수 → UPSERT with version+1
 *
 * 실패 정책:
 *   - env 미설정 / newLogs 비어 있음 → previousSummary 통과 (또는 빈 summary).
 *   - LLM 호출/파싱/스키마 실패 → previousSummary 통과 + isFallback=true.
 *   - 어떤 경우에도 throw 하지 않는다 — 호출측이 큐 row 마무리를 못 하면 재시도
 *     루프가 무한히 돈다.
 */
export async function generateMemorySummary(
  input: MemorySummaryInput,
): Promise<MemorySummaryResult> {
  const start = Date.now()

  const parsed = memorySummaryInputSchema.safeParse(input)
  if (!parsed.success) {
    // input 자체가 깨졌으면 우리가 본 적 있는 previousSummary (있는 그대로) 보존.
    return fallbackResult(
      input.previousSummary ?? null,
      `input-validation-failed: ${parsed.error.message}`,
      start,
    )
  }
  const safeInput = parsed.data

  // 빈 newLogs 는 LLM 호출 자체를 건너뜀 — 토큰 낭비 + 같은 결과.
  if (safeInput.newLogs.length === 0) {
    return fallbackResult(
      safeInput.previousSummary ?? null,
      'no-new-logs',
      start,
    )
  }

  const client = getAnthropic()
  if (!client) {
    return fallbackResult(
      safeInput.previousSummary ?? null,
      'anthropic-api-key-missing',
      start,
    )
  }

  try {
    const userMessage = JSON.stringify({
      petName: safeInput.petName,
      breed: safeInput.breed ?? null,
      personaFragment: safeInput.personaFragment,
      previousSummary: safeInput.previousSummary ?? null,
      newLogs: safeInput.newLogs,
    })

    const response = await client.messages.create({
      model: DIARY_MODEL,
      max_tokens: MAX_OUTPUT_TOKENS,
      system: MEMORY_SUMMARY_SYSTEM_PROMPT_V1,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: userMessage,
            },
          ],
        },
      ],
    })

    const textBlock = response.content.find((b) => b.type === 'text')
    if (!textBlock || textBlock.type !== 'text') {
      return fallbackResult(
        safeInput.previousSummary ?? null,
        'no-text-block-in-response',
        start,
      )
    }

    const json = tryParseJson(textBlock.text)
    if (json === null) {
      return fallbackResult(
        safeInput.previousSummary ?? null,
        'json-parse-failed',
        start,
      )
    }

    const validated = memorySummarySchema.safeParse(json)
    if (!validated.success) {
      return fallbackResult(
        safeInput.previousSummary ?? null,
        `schema-validation-failed: ${validated.error.message}`,
        start,
      )
    }

    return {
      ok: true,
      data: validated.data,
      meta: {
        modelUsed: `${DIARY_MODEL}@${MEMORY_SUMMARY_PROMPT_VERSION}`,
        latencyMs: Date.now() - start,
        tokensInput: response.usage.input_tokens,
        tokensOutput: response.usage.output_tokens,
        isFallback: false,
      },
    }
  } catch (err) {
    const reason = err instanceof Error ? err.message : 'unknown-llm-error'
    console.error('[generateMemorySummary] LLM call failed:', reason)
    return fallbackResult(
      safeInput.previousSummary ?? null,
      `llm-error: ${reason}`,
      start,
    )
  }
}
