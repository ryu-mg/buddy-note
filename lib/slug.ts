// Slug 생성. 한글 이름 → 가능하면 간단한 로마자 근사치, 실패 시 nanoid fallback.
// 의존성 최소화: nanoid v3 가 이미 설치되어 있으면 그걸 쓰고, 없으면 내부 fallback.

import { customAlphabet } from 'nanoid'

// URL-safe, 애매한 문자 (0/O, 1/l/I) 제외 — 사람이 읽고 쳐도 혼동 덜.
const SLUG_ALPHABET = '23456789abcdefghjkmnpqrstuvwxyz'
const nano = customAlphabet(SLUG_ALPHABET, 8)

/**
 * 이름에서 base slug 를 만든다.
 * 규칙 (README-level):
 *  1) trim + lowercase
 *  2) 한글 → 간단 로마자 근사치 (음절 단위 초성+중성; 2350자 전체 테이블 없이 근사만)
 *  3) 공백/구두점 → "-" 로, 연속 하이픈 축약
 *  4) 30자 컷
 *  5) 결과가 비거나 3자 미만이면 nanoid(8) fallback
 *
 * 충돌 처리(-2, -3 …)는 호출 측(server action) 에서.
 */
export function baseSlug(name: string): string {
  const raw = (name ?? '').trim().toLowerCase()
  if (!raw) return nano()

  const romanized = romanizeKoreanLite(raw)

  let s = romanized
    .normalize('NFKD')
    // 라틴 악센트류 제거
    .replace(/[\u0300-\u036f]/g, '')
    // 허용문자 외엔 전부 하이픈
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')

  if (s.length > 30) s = s.slice(0, 30).replace(/-+$/g, '')

  if (s.length < 3) return nano()
  return s
}

/**
 * 충돌 후보 생성: base, base-2, base-3 ...
 * 호출자가 순차적으로 "이 후보가 사용가능한가?" 체크하면서 증가.
 */
export function candidateFor(base: string, attempt: number): string {
  if (attempt <= 1) return base
  return `${base}-${attempt}`
}

// ---- internals ----

// 한글 음절 → 초성/중성/종성 분리 → 로마자 근사.
// MIT/Revised Romanization 의 간략 버전. 정확하진 않지만 URL 용으로 충분.
const CHO = [
  'g', 'kk', 'n', 'd', 'tt', 'r', 'm', 'b', 'pp',
  's', 'ss', '', 'j', 'jj', 'ch', 'k', 't', 'p', 'h',
]
const JUNG = [
  'a', 'ae', 'ya', 'yae', 'eo', 'e', 'yeo', 'ye', 'o',
  'wa', 'wae', 'oe', 'yo', 'u', 'wo', 'we', 'wi', 'yu', 'eu', 'ui', 'i',
]
const JONG = [
  '', 'k', 'k', 'ks', 'n', 'nj', 'nh', 'd', 'l', 'lg', 'lm',
  'lb', 'ls', 'lt', 'lp', 'lh', 'm', 'p', 'ps', 's', 'ss',
  'ng', 'j', 'ch', 'k', 't', 'p', 'h',
]

function romanizeKoreanLite(input: string): string {
  let out = ''
  for (const ch of input) {
    const code = ch.codePointAt(0) ?? 0
    if (code >= 0xac00 && code <= 0xd7a3) {
      const idx = code - 0xac00
      const cho = Math.floor(idx / (21 * 28))
      const jung = Math.floor((idx % (21 * 28)) / 28)
      const jong = idx % 28
      out += (CHO[cho] ?? '') + (JUNG[jung] ?? '') + (JONG[jong] ?? '')
    } else {
      out += ch
    }
  }
  return out
}
