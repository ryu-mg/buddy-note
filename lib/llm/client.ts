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
 * Diary 생성은 제품 품질의 핵심 경로라 Sonnet 계열을 유지한다.
 * 사진 해석 + 한국어 감성 문체 + 페르소나 반영 품질이 비용보다 우선이다.
 */
export const DIARY_MODEL = 'claude-sonnet-4-6'

/**
 * Memory 요약은 사용자에게 직접 보이는 문장이 아니라 내부 압축 작업이다.
 * 비용/지연을 줄이기 위해 Haiku 계열을 사용한다.
 */
export const MEMORY_MODEL = 'claude-haiku-4-5'

/**
 * Health check 는 모델 연결성만 검증하면 되므로 가장 저렴하고 빠른 모델을 쓴다.
 */
export const HEALTHCHECK_MODEL = MEMORY_MODEL
