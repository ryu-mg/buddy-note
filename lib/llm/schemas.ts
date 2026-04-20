import { z } from 'zod'

import { recentCallbackSchema, type RecentCallback } from '@/lib/llm/memory-schemas'
import type { LogTag } from '@/types/database'

/**
 * Allowed log-tag vocabulary, mirrored from `types/database.ts#LogTag`.
 * Keep these two lists in sync — this enum is the runtime guard, the TS
 * union is the compile-time guard.
 */
export const LOG_TAG_VALUES = [
  'meal',
  'walk',
  'bathroom',
  'play',
  'sleep',
  'outing',
  'bath',
  'snack',
] as const satisfies readonly LogTag[]

export const logTagSchema = z.enum(LOG_TAG_VALUES)

/**
 * LLM output shape for a single diary generation.
 *
 * - `title`: 짧은 한 마디. 1~40자.
 * - `body`: 강아지 1인칭 한국어 일기. 20~600자.
 * - `suggestedTags`: `LogTag` vocabulary 서브셋, 최대 8개 (빈 배열 OK).
 */
export const diarySchema = z.object({
  title: z.string().min(1).max(40),
  body: z.string().min(20).max(600),
  suggestedTags: z.array(logTagSchema).max(8),
})

export type DiaryOutput = z.infer<typeof diarySchema>

/**
 * Recent callback 항목 — `pet_memory_summary.recent_callbacks` jsonb 와 동일 shape.
 * LLM 입력으로 system prompt 에 직렬화되어 들어간다.
 * Source of truth: lib/llm/memory-schemas.ts#recentCallbackSchema (재사용).
 */
export { recentCallbackSchema }
export type RecentCallbackInput = RecentCallback

/**
 * Diary 생성 호출 입력.
 *
 * - `photoBase64`: strip-EXIF 를 마친 이미지 바이너리의 base64 인코딩 (data URL prefix 없음).
 * - `photoMediaType`: `image/jpeg` | `image/png` | `image/gif` | `image/webp`.
 * - `petName`: pets.name (공백 trim 된 상태로 전달).
 * - `personaFragment`: `buildPersonaPromptFragment(...)` 결과. null 이면 fallback 경로.
 * - `memo`: 사용자 메모. 200자 cap (CHECK constraint + zod 여기서도 재검증).
 * - `recentCallbacks`: 최근 10건 이내.
 */
export const diaryInputSchema = z.object({
  photoBase64: z.string().min(1),
  photoMediaType: z.enum(['image/jpeg', 'image/png', 'image/gif', 'image/webp']),
  petName: z.string().trim().min(1).max(24),
  // personaFragment 는 `buildPersonaPromptFragment` (lib/pet-mbti.ts) 가
  // 5개 고정 option fragment 를 " / " 로 이어 만든다. 이론적 상한은 ~400자
  // 수준이지만, DB row 가 poisoning 됐을 때를 대비해 500자 cap 으로 방어.
  personaFragment: z.string().min(1).max(500),
  memo: z.string().max(200).optional().default(''),
  recentCallbacks: z.array(recentCallbackSchema).max(10).optional().default([]),
})

export type DiaryInput = z.infer<typeof diaryInputSchema>
