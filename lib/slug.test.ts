import { describe, it, expect } from 'bun:test'

import { baseSlug, candidateFor } from '@/lib/slug'

// AGENTS.md 스펙 — 3~30자, [a-z0-9] 시작, 이후 [a-z0-9-].
const SLUG_REGEX = /^[a-z0-9][a-z0-9-]{2,29}$/

// 한 번 베이스를 만든 뒤 candidateFor 로 만든 후보도 마찬가지로 합법.
const CANDIDATE_REGEX = /^[a-z0-9][a-z0-9-]{2,}$/

// --------------------------------------------------------------------------
// baseSlug — 한국어 romanize happy path
// --------------------------------------------------------------------------

describe('baseSlug — Korean romanize', () => {
  it('콩이 → kongi', () => {
    expect(baseSlug('콩이')).toBe('kongi')
  })

  it('마루 → maru', () => {
    expect(baseSlug('마루')).toBe('maru')
  })

  it('푸들 → pudeul', () => {
    expect(baseSlug('푸들')).toBe('pudeul')
  })

  it('멍멍이 → meongmeongi', () => {
    expect(baseSlug('멍멍이')).toBe('meongmeongi')
  })

  it('같은 한글 이름은 deterministic (호출마다 동일)', () => {
    const a = baseSlug('콩이')
    const b = baseSlug('콩이')
    const c = baseSlug('콩이')
    expect(a).toBe(b)
    expect(b).toBe(c)
  })
})

// --------------------------------------------------------------------------
// baseSlug — nanoid fallback
// --------------------------------------------------------------------------

describe('baseSlug — nanoid fallback', () => {
  it('빈 문자열 → 8자 nanoid (항상 서로 다름)', () => {
    const s1 = baseSlug('')
    const s2 = baseSlug('')
    expect(s1).toHaveLength(8)
    expect(s2).toHaveLength(8)
    expect(s1).not.toBe(s2)
  })

  it('공백만 있는 이름 → nanoid fallback', () => {
    const s = baseSlug('   ')
    expect(s).toHaveLength(8)
    // 허용 문자: 23456789abcdefghjkmnpqrstuvwxyz (nanoid alphabet)
    expect(s).toMatch(/^[23456789abcdefghjkmnpqrstuvwxyz]{8}$/)
  })

  it('2자 미만으로 줄어드는 입력 → nanoid fallback', () => {
    // "a" 는 로마자 1자 → 3자 미만 → nanoid(8)
    const s = baseSlug('a')
    expect(s).toHaveLength(8)
    expect(s).toMatch(/^[23456789abcdefghjkmnpqrstuvwxyz]{8}$/)
  })

  it('이모지만 있는 입력 → nanoid fallback', () => {
    const s = baseSlug('🐶🐾')
    expect(s).toHaveLength(8)
  })

  it('구두점만 있는 입력 → nanoid fallback', () => {
    const s = baseSlug('---')
    expect(s).toHaveLength(8)
  })
})

// --------------------------------------------------------------------------
// baseSlug — 일반 케이스 / 정규화
// --------------------------------------------------------------------------

describe('baseSlug — normalization', () => {
  it('대문자를 소문자로', () => {
    expect(baseSlug('KOREA')).toBe('korea')
  })

  it('공백은 하이픈으로', () => {
    expect(baseSlug('My Dog')).toBe('my-dog')
  })

  it('이모지는 제거 (알파넘 부분만 남음)', () => {
    expect(baseSlug('My Dog 🐶')).toBe('my-dog')
  })

  it('라틴 악센트는 벗겨짐', () => {
    expect(baseSlug('café')).toBe('cafe')
  })

  it('숫자만이어도 허용', () => {
    expect(baseSlug('12345')).toBe('12345')
  })

  it('3자 이상이면 그대로', () => {
    expect(baseSlug('abc')).toBe('abc')
  })

  it('30자 컷', () => {
    const long = baseSlug('a'.repeat(50))
    expect(long.length).toBeLessThanOrEqual(30)
    expect(long).toBe('a'.repeat(30))
  })

  it('한글 + 영문/숫자 혼합', () => {
    expect(baseSlug('콩이-1')).toBe('kongi-1')
  })
})

// --------------------------------------------------------------------------
// baseSlug — regex 유효성 (모든 출력이 AGENTS.md 스펙 regex 를 통과)
// --------------------------------------------------------------------------

describe('baseSlug — 결과는 slug regex 를 만족', () => {
  const samples = [
    '콩이',
    '마루',
    '푸들',
    '멍멍이',
    'Spot',
    'KOREA',
    'my dog',
    'My Dog 🐶',
    'café',
    '12345',
    'abc',
    'a'.repeat(50),
    '콩이-1',
    // fallback 를 타는 것도 유효해야 함
    '',
    '   ',
    'a',
    '🐶🐾',
    '---',
  ]

  for (const s of samples) {
    it(`baseSlug(${JSON.stringify(s)}) 은 slug regex 통과`, () => {
      const out = baseSlug(s)
      expect(out).toMatch(SLUG_REGEX)
    })
  }
})

// --------------------------------------------------------------------------
// baseSlug — nanoid fallback 유니크성 (충돌 모의)
// --------------------------------------------------------------------------

describe('baseSlug — nanoid 100번 호출 유니크', () => {
  it('빈 입력으로 100개 뽑아도 충돌 없음', () => {
    const set = new Set<string>()
    for (let i = 0; i < 100; i++) set.add(baseSlug(''))
    expect(set.size).toBe(100)
  })
})

// --------------------------------------------------------------------------
// candidateFor
// --------------------------------------------------------------------------

describe('candidateFor', () => {
  it('attempt=1 이면 base 그대로', () => {
    expect(candidateFor('maru', 1)).toBe('maru')
  })

  it('attempt<=1 이면 base 그대로 (방어적)', () => {
    expect(candidateFor('maru', 0)).toBe('maru')
    expect(candidateFor('maru', -5)).toBe('maru')
  })

  it('attempt>=2 이면 "-N" 접미', () => {
    expect(candidateFor('maru', 2)).toBe('maru-2')
    expect(candidateFor('maru', 5)).toBe('maru-5')
    expect(candidateFor('kongi', 10)).toBe('kongi-10')
  })

  it('candidateFor 결과도 slug regex 통과 (base 가 유효할 때)', () => {
    const base = baseSlug('콩이')
    for (let i = 1; i <= 10; i++) {
      expect(candidateFor(base, i)).toMatch(CANDIDATE_REGEX)
    }
  })
})
