import { z } from 'zod'

import { recentCallbackSchema } from '@/lib/llm/memory-schemas'

/**
 * `pet_memory_summary.recent_callbacks` (jsonb) → 일기 생성 프롬프트에 넣을
 * 한 줄 문자열 배열로 변환하는 어댑터.
 *
 * - DB 컬럼은 `Json` 이라 런타임에서는 `unknown` 으로 다뤄야 안전 (RLS 우회로
 *   service role 이 잘못된 shape 을 쓴 row 가 들어와도 다이어리 생성이 죽지
 *   않도록).
 * - zod 로 한 번 파싱 → 실패하면 `[]` (다이어리 호출은 callbacks 없이 진행).
 * - 결과는 최대 5개의 `note` 문자열. `referenceDate`/`source` 는 LLM 메시지
 *   포맷팅 단계에서 더 필요하면 다시 별도 어댑터를 만들어 노출한다.
 *
 * 이 헬퍼 덕분에 `app/log/actions.ts` 같은 호출측이 `memory-schemas` 를 직접
 * import 하지 않아도 된다 (의존 방향 정리, rules/architecture.md §6).
 */

const recentCallbacksJsonSchema = z.array(recentCallbackSchema)

export function buildCallbacksForDiary(
  summary: { recent_callbacks: unknown } | null,
): string[] {
  if (!summary) return []
  const parsed = recentCallbacksJsonSchema.safeParse(summary.recent_callbacks)
  if (!parsed.success) return []
  return parsed.data.slice(0, 5).map((c) => c.note)
}
