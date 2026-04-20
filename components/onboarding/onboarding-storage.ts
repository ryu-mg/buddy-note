// Onboarding draft persistence (client-only, localStorage).
//
// v1 Week 1: device-scoped resume — 유저가 stepper 중간에 이탈했다가 다시
// `/onboarding/steps/[step]` 으로 돌아오면 마지막 입력을 복원. DB 이전은 v1.5.
//
// - Key는 `buddy-note:onboarding` (AGENTS.md 명시).
// - `savedAt` 기반 7일 만료 (stale draft 자동 폐기).
// - localStorage 접근은 try/catch (사파리 프라이빗 모드 / QuotaExceeded 방어).
// - SSR-safe (`typeof window === 'undefined'` → null 반환).
// - 스키마 mismatch (코드 업데이트로 option key 등이 달라짐) 시 parse 실패 →
//   draft 버림 (corrupt draft 가 stepper 를 망가뜨리지 않게).
//
// 이 파일은 순수 util 이라 React 와 독립. 컴포넌트는 mount 후 useEffect 에서만
// 호출해서 SSR hydration mismatch 를 피한다.

import { QUESTION_IDS, type Answers, type OptionKey } from '@/lib/pet-mbti'
import type { Species } from './name-form'

const STORAGE_KEY = 'buddy-note:onboarding'
const MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000 // 7일

export type OnboardingDraft = {
  name: string
  species: Species
  breed: string
  answers: Partial<Answers>
  lastStep: number
  savedAt: string // ISO
}

function isOptionKey(v: unknown): v is OptionKey {
  return v === 'A' || v === 'B' || v === 'C' || v === 'D'
}

function isSpecies(v: unknown): v is Species {
  return v === 'dog' || v === 'cat'
}

function sanitizeAnswers(x: unknown): Partial<Answers> {
  const out: Partial<Answers> = {}
  if (!x || typeof x !== 'object') return out
  for (const id of QUESTION_IDS) {
    const v = (x as Record<string, unknown>)[id]
    if (isOptionKey(v)) out[id] = v
  }
  return out
}

function clampStep(n: unknown): number {
  if (typeof n !== 'number' || Number.isNaN(n)) return 0
  return Math.min(Math.max(Math.trunc(n), 0), 6)
}

/**
 * localStorage 에서 draft 를 읽는다.
 *
 * 반환 null 조건:
 *  - SSR (window 없음)
 *  - 키 없음
 *  - JSON parse 실패
 *  - savedAt 가 7일 이상 지남
 *  - 필수 필드 누락
 */
export function readDraft(): OnboardingDraft | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return null

    const parsed: unknown = JSON.parse(raw)
    if (!parsed || typeof parsed !== 'object') return null

    const obj = parsed as Record<string, unknown>

    // savedAt 만료 체크
    const savedAt = typeof obj.savedAt === 'string' ? obj.savedAt : null
    if (!savedAt) return null
    const savedTime = Date.parse(savedAt)
    if (Number.isNaN(savedTime)) return null
    if (Date.now() - savedTime > MAX_AGE_MS) {
      // stale — 청소하고 돌려준다
      try {
        window.localStorage.removeItem(STORAGE_KEY)
      } catch {
        /* noop */
      }
      return null
    }

    const name = typeof obj.name === 'string' ? obj.name : ''
    const species = isSpecies(obj.species) ? obj.species : 'dog'
    const breed = typeof obj.breed === 'string' ? obj.breed : ''
    const answers = sanitizeAnswers(obj.answers)
    const lastStep = clampStep(obj.lastStep)

    return { name, species, breed, answers, lastStep, savedAt }
  } catch {
    return null
  }
}

/**
 * draft 를 localStorage 에 쓴다. 실패 (QuotaExceeded, private 모드) 는 조용히 무시.
 * 호출자가 `savedAt` 을 매번 다시 찍을 필요 없이 여기서 갱신한다.
 */
export function saveDraft(draft: Omit<OnboardingDraft, 'savedAt'>): void {
  if (typeof window === 'undefined') return
  try {
    const payload: OnboardingDraft = {
      ...draft,
      savedAt: new Date().toISOString(),
    }
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload))
  } catch {
    /* ignore quota / private-mode errors */
  }
}

/**
 * draft 제거. 저장 성공 시 호출 (server action 후 client 에서).
 */
export function clearDraft(): void {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.removeItem(STORAGE_KEY)
  } catch {
    /* noop */
  }
}
