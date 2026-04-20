import 'server-only'

import Anthropic from '@anthropic-ai/sdk'

/**
 * Singleton Anthropic SDK client.
 *
 * env 미설정 시 `null` 반환 — 호출측이 반드시 null-guard 후 fallback 처리.
 * (AGENTS.md "Env var 없을 때 graceful fallback" 원칙)
 */

let cached: Anthropic | null | undefined

export function getAnthropic(): Anthropic | null {
  if (cached !== undefined) return cached
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    cached = null
    return null
  }
  cached = new Anthropic({ apiKey })
  return cached
}

/**
 * Diary 생성용 모델 ID.
 *
 * TODO: Week 0 A/B — AGENTS.md D4 에 따라 `claude-sonnet-4-6` 을 tentative 로
 * 명시했으나, Week 0 벤치마크 종료 후 최종 확정. 그 전까지는 안전하게 4-5 를
 * default 로 두고 `diaries.model_used` 로 A/B 추적.
 */
export const DIARY_MODEL = 'claude-sonnet-4-5'
