import { describe, it, expect } from 'bun:test'

import {
  QUESTIONS,
  QUESTION_IDS,
  buildPersonaPromptFragment,
  getQuestion,
  isCompleteAnswers,
  type Answers,
  type OptionKey,
  type QuestionId,
} from '@/lib/pet-mbti'

// --------------------------------------------------------------------------
// QUESTIONS 구조 검증 (docs/pet-mbti-questions-v0.md 와 1:1 일치해야 함)
// --------------------------------------------------------------------------

describe('QUESTIONS', () => {
  it('정확히 5문항이다', () => {
    expect(QUESTIONS).toHaveLength(5)
    expect(QUESTION_IDS).toHaveLength(5)
  })

  it('QUESTION_IDS 가 q1~q5 로 고정 순서', () => {
    expect(QUESTION_IDS).toEqual(['q1', 'q2', 'q3', 'q4', 'q5'])
  })

  it('question id 가 유니크하다', () => {
    const ids = QUESTIONS.map((q) => q.id)
    const uniq = new Set(ids)
    expect(uniq.size).toBe(ids.length)
  })

  it('각 문항은 정확히 A/B/C/D 4개 옵션을 가진다', () => {
    for (const q of QUESTIONS) {
      expect(q.options).toHaveLength(4)
      const keys = q.options.map((o) => o.key)
      expect(keys).toEqual(['A', 'B', 'C', 'D'])
    }
  })

  it('모든 옵션의 prompt_fragment 가 비어있지 않다', () => {
    for (const q of QUESTIONS) {
      for (const o of q.options) {
        expect(o.prompt_fragment.length).toBeGreaterThan(0)
        expect(o.label.length).toBeGreaterThan(0)
      }
    }
  })

  it('다섯 축이 전부 커버된다 (energy/social/attachment/stimulus/routine)', () => {
    const axes = new Set(QUESTIONS.map((q) => q.axis))
    expect(axes.size).toBe(5)
    expect(axes.has('energy')).toBeTruthy()
    expect(axes.has('social')).toBeTruthy()
    expect(axes.has('attachment')).toBeTruthy()
    expect(axes.has('stimulus')).toBeTruthy()
    expect(axes.has('routine')).toBeTruthy()
  })
})

// --------------------------------------------------------------------------
// getQuestion
// --------------------------------------------------------------------------

describe('getQuestion', () => {
  it('유효 id 는 해당 Question 을 반환', () => {
    const q = getQuestion('q3')
    expect(q.id).toBe('q3')
    expect(q.axis).toBe('attachment')
  })

  it('잘못된 id 면 throw', () => {
    expect(() => getQuestion('q99' as QuestionId)).toThrow('Unknown question id')
  })
})

// --------------------------------------------------------------------------
// isCompleteAnswers
// --------------------------------------------------------------------------

describe('isCompleteAnswers', () => {
  const full: Answers = { q1: 'A', q2: 'B', q3: 'C', q4: 'D', q5: 'A' }

  it('null/undefined 은 false', () => {
    expect(isCompleteAnswers(null)).toBeFalsy()
    expect(isCompleteAnswers(undefined)).toBeFalsy()
  })

  it('빈 객체는 false', () => {
    expect(isCompleteAnswers({})).toBeFalsy()
  })

  it('일부만 채워지면 false', () => {
    expect(isCompleteAnswers({ q1: 'A', q2: 'B' })).toBeFalsy()
  })

  it('5문항 전부 A~D 면 true', () => {
    expect(isCompleteAnswers(full)).toBeTruthy()
  })

  it('A~D 밖의 값이 섞여 있으면 false', () => {
    const bad = { ...full, q3: 'E' } as unknown as Partial<Answers>
    expect(isCompleteAnswers(bad)).toBeFalsy()
  })
})

// --------------------------------------------------------------------------
// buildPersonaPromptFragment — happy path + snapshot
// --------------------------------------------------------------------------

describe('buildPersonaPromptFragment — happy path', () => {
  const answers: Answers = { q1: 'A', q2: 'A', q3: 'A', q4: 'A', q5: 'A' }

  it('이름, 품종이 모두 들어간다', () => {
    const out = buildPersonaPromptFragment({
      name: '마루',
      breed: '푸들',
      answers,
    })
    expect(out).toContain('마루')
    expect(out).toContain('푸들')
    // 받침(ㄹ) → '이야'
    expect(out).toContain('나는 마루, 푸들이야.')
  })

  it('5개 prompt_fragment 가 " / " 로 이어진다', () => {
    const out = buildPersonaPromptFragment({
      name: '마루',
      breed: '푸들',
      answers,
    })
    // 4개의 구분자 " / " — 5개 조각 사이
    const sepCount = (out.match(/ \/ /g) || []).length
    expect(sepCount).toBe(4)
  })

  it('각 문항에서 선택된 옵션의 prompt_fragment 가 모두 등장', () => {
    const out = buildPersonaPromptFragment({
      name: '마루',
      breed: '푸들',
      answers,
    })
    for (const id of QUESTION_IDS) {
      const frag = getQuestion(id).options.find((o) => o.key === answers[id])!
        .prompt_fragment
      expect(out).toContain(frag)
    }
  })

  it('품종이 비어 있으면 이름만 주어 문장 작성', () => {
    const out = buildPersonaPromptFragment({
      name: '콩이',
      breed: '',
      answers,
    })
    expect(out).toContain('나는 콩이야.')
    expect(out).not.toContain(', ,')
  })

  it('snapshot — 전체 출력 (wording regression 가드)', () => {
    const out = buildPersonaPromptFragment({
      name: '마루',
      breed: '푸들',
      answers: { q1: 'A', q2: 'A', q3: 'A', q4: 'A', q5: 'A' },
    })
    expect(out).toBe(
      '나는 마루, 푸들이야. 나를 한 줄로 말하면:\n' +
        '에너지 폭발, 문 앞에 이미 도착해 있고' +
        ' / 공원에서 처음 본 친구한테도 먼저 달려가서 인사하고' +
        ' / 엄마가 잠깐 화장실만 가도 문 앞에서 끙끙거리고' +
        ' / 청소기 소리에는 일단 달려가서 짖고 보는 대담한 쪽이고' +
        ' / 새 길에 더 신나하는 탐험가 타입이야.',
    )
  })
})

// --------------------------------------------------------------------------
// buildPersonaPromptFragment — 모든 옵션 분기 (질문별로 A~D 변경)
// --------------------------------------------------------------------------

describe('buildPersonaPromptFragment — option branch coverage', () => {
  // baseline: 모든 답 'A'. 한 문항씩 돌려가면서 해당 옵션 문구가 출력에 포함됨을 확인.
  const BASELINE: Answers = { q1: 'A', q2: 'A', q3: 'A', q4: 'A', q5: 'A' }
  const opts: OptionKey[] = ['A', 'B', 'C', 'D']

  for (const id of QUESTION_IDS) {
    for (const key of opts) {
      it(`${id}=${key} 일 때 해당 prompt_fragment 가 출력에 포함된다`, () => {
        const answers: Answers = { ...BASELINE, [id]: key }
        const frag = getQuestion(id).options.find((o) => o.key === key)!
          .prompt_fragment
        const out = buildPersonaPromptFragment({
          name: '테스트',
          breed: '믹스견',
          answers,
        })
        expect(out).toContain(frag)
      })
    }
  }
})

// --------------------------------------------------------------------------
// buildPersonaPromptFragment — 에지 케이스 (현행 동작 문서화)
// --------------------------------------------------------------------------

describe('buildPersonaPromptFragment — edge cases', () => {
  const answers: Answers = { q1: 'A', q2: 'A', q3: 'A', q4: 'A', q5: 'A' }

  it('이름이 공백만이면 trim 후 빈 문자열 — "나는 야." 형태로 (현행 동작 문서화)', () => {
    const out = buildPersonaPromptFragment({
      name: '   ',
      breed: '푸들',
      answers,
    })
    // trim → name='', breed='푸들' → subject = ', 푸들' (현행 동작)
    expect(out).toContain('나는 , 푸들이야.')
  })

  it('이름과 품종 모두 공백이면 "나는 야." 형태 (현행 동작 문서화)', () => {
    const out = buildPersonaPromptFragment({
      name: '  ',
      breed: '  ',
      answers,
    })
    expect(out.startsWith('나는 야.')).toBeTruthy()
  })

  it('앞뒤 공백이 있는 이름은 trim 된다', () => {
    const out = buildPersonaPromptFragment({
      name: '  마루  ',
      breed: '  푸들  ',
      answers,
    })
    expect(out).toContain('나는 마루, 푸들이야.')
  })

  it('잘못된 answer 코드 ("E") 가 있으면 throw', () => {
    const bad = { ...answers, q2: 'E' as unknown as OptionKey }
    expect(() =>
      buildPersonaPromptFragment({
        name: '마루',
        breed: '푸들',
        answers: bad,
      }),
    ).toThrow('Missing answer for q2')
  })
})
