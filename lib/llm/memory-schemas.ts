import { z } from 'zod'

/**
 * `pet_memory_summary` LLM 갱신 입출력 스키마.
 *
 * docs/prompts/memory-summary-v1.md 의 input / output contract 와 1:1 대응.
 * `pet_memory_summary` 테이블 컬럼 (snake_case) 과 LLM 메시지 안에서 쓰는 필드
 * (camelCase) 가 다른 점에 주의 — 이 파일은 **LLM 경계용 camelCase** 스키마다.
 * DB row 매핑은 호출측에서 한다.
 */

// -----------------------------------------------------------------------------
// Output — 모델이 생성하는 JSON
// -----------------------------------------------------------------------------

/**
 * `pet_memory_summary.recent_callbacks` jsonb 안의 한 항목.
 * - `note`: 일기에서 자연스럽게 회상될 만한 한 줄 (max 40자).
 * - `source`: 원본이 raw log 인지 LLM 생성 diary 인지.
 * - `referenceDate`: YYYY-MM-DD (createdAt 의 날짜 부분).
 */
export const recentCallbackSchema = z.object({
  note: z.string().min(1).max(40),
  source: z.enum(['log', 'diary']),
  referenceDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'referenceDate 는 YYYY-MM-DD 포맷이어야 함'),
})

export type RecentCallback = z.infer<typeof recentCallbackSchema>

/**
 * 모델 출력 = 갱신된 memory summary.
 *
 * - `toneDescription`: 1~2문장 총평. 빈 문자열 허용 (첫 갱신 시 newLogs 가
 *   비어 있으면 빈 summary 를 그대로 통과시킴).
 * - `recurringHabits`, `favoriteThings`: 각 max 8개, 한 항목 max 30자.
 * - `recentCallbacks`: max 5개.
 */
export const memorySummarySchema = z.object({
  toneDescription: z.string().max(200),
  recurringHabits: z.array(z.string().min(1).max(30)).max(8),
  favoriteThings: z.array(z.string().min(1).max(30)).max(8),
  recentCallbacks: z.array(recentCallbackSchema).max(5),
})

export type MemorySummaryOutput = z.infer<typeof memorySummarySchema>

// -----------------------------------------------------------------------------
// Input — 호출측이 함수에 넘기는 페이로드
// -----------------------------------------------------------------------------

/**
 * `previousSummary` 안에서는 DB 컬럼명 그대로 (snake_case) 사용해 호출측이
 * `pet_memory_summary` row 를 거의 그대로 넘길 수 있게 한다. 단, 같은 `recent_callbacks`
 * 항목은 새 contract (`note`/`source`/`referenceDate`) 를 따른다.
 */
export const previousSummaryInputSchema = z.object({
  tone_description: z.string().max(200).nullable(),
  recurring_habits: z.array(z.string()).default([]),
  favorite_things: z.array(z.string()).default([]),
  recent_callbacks: z.array(recentCallbackSchema).default([]),
})

export type PreviousSummaryInput = z.infer<typeof previousSummaryInputSchema>

/**
 * memory updater 에 들어가는 새 로그 한 건. diary 가 아직 없으면 title/body 는
 * undefined — fallback diary 가 만들어진 직후의 row 도 OK.
 */
export const memoryLogInputSchema = z.object({
  createdAt: z.string().min(1), // ISO8601, 모델이 referenceDate 추출에 사용
  tags: z.array(z.string()).default([]),
  memo: z.string().max(200).nullable().optional(),
  diaryTitle: z.string().max(200).nullable().optional(),
  diaryBody: z.string().max(2000).nullable().optional(),
})

export type MemoryLogInput = z.infer<typeof memoryLogInputSchema>

/**
 * `generateMemorySummary` 입력 전체.
 *
 * - `petName`, `breed`, `personaFragment`: pets 테이블에서 가져온 메타.
 * - `previousSummary`: 직전 summary. 없을 수 있음 (첫 갱신).
 * - `newLogs`: 직전 갱신 이후 들어온 로그들. 시간 오름차순, 최대 20건.
 *   비어 있으면 함수는 LLM 호출을 건너뛰고 previousSummary 를 그대로 통과시킨다.
 */
export const memorySummaryInputSchema = z.object({
  petName: z.string().trim().min(1).max(24),
  breed: z.string().max(60).nullable().optional(),
  personaFragment: z.string().min(1),
  previousSummary: previousSummaryInputSchema.nullable().optional(),
  newLogs: z.array(memoryLogInputSchema).max(20).default([]),
})

export type MemorySummaryInput = z.infer<typeof memorySummaryInputSchema>
