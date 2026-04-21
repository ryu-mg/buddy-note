import { describe, it, expect } from 'bun:test'

import {
  QUESTIONS,
  QUESTION_IDS,
  buildPersonaPromptFragment,
  calculatePersonality,
  getQuestion,
  isCompleteAnswers,
  type Answers,
  type OptionKey,
  type QuestionId,
} from '@/lib/pet-mbti'

describe('QUESTIONS', () => {
  it('정확히 4문항이다', () => {
    expect(QUESTIONS).toHaveLength(4)
    expect(QUESTION_IDS).toHaveLength(4)
  })

  it('QUESTION_IDS 가 q1~q4 로 고정 순서', () => {
    expect(QUESTION_IDS).toEqual(['q1', 'q2', 'q3', 'q4'])
  })

  it('각 문항은 정확히 A/B 2개 옵션을 가진다', () => {
    for (const q of QUESTIONS) {
      expect(q.options).toHaveLength(2)
      expect(q.options.map((o) => o.key)).toEqual(['A', 'B'])
    }
  })

  it('네 축이 전부 커버된다', () => {
    const axes = new Set(QUESTIONS.map((q) => q.axis))
    expect(axes).toEqual(new Set(['ei', 'sn', 'tf', 'jp']))
  })
})

describe('getQuestion', () => {
  it('유효 id 는 해당 Question 을 반환', () => {
    const q = getQuestion('q3')
    expect(q.id).toBe('q3')
    expect(q.axis).toBe('tf')
  })

  it('잘못된 id 면 throw', () => {
    expect(() => getQuestion('q99' as QuestionId)).toThrow('Unknown question id')
  })
})

describe('isCompleteAnswers', () => {
  const full: Answers = { q1: 'A', q2: 'B', q3: 'A', q4: 'B' }

  it('null/undefined 은 false', () => {
    expect(isCompleteAnswers(null)).toBeFalsy()
    expect(isCompleteAnswers(undefined)).toBeFalsy()
  })

  it('일부만 채워지면 false', () => {
    expect(isCompleteAnswers({ q1: 'A', q2: 'B' })).toBeFalsy()
  })

  it('4문항 전부 A/B 면 true', () => {
    expect(isCompleteAnswers(full)).toBeTruthy()
  })

  it('A/B 밖의 값이 섞여 있으면 false', () => {
    const bad = { ...full, q3: 'C' } as unknown as Partial<Answers>
    expect(isCompleteAnswers(bad)).toBeFalsy()
  })
})

describe('calculatePersonality', () => {
  it('답변을 사람 MBTI 코드 순서로 변환한다', () => {
    expect(
      calculatePersonality({ q1: 'A', q2: 'A', q3: 'B', q4: 'B' }),
    ).toEqual({ code: 'ENFP', label: '문앞 탐험가' })

    expect(
      calculatePersonality({ q1: 'B', q2: 'B', q3: 'A', q4: 'A' }),
    ).toEqual({ code: 'ISTJ', label: '차분한 루틴 수호자' })
  })

  it('16개 유형을 모두 만들 수 있다', () => {
    const opts: OptionKey[] = ['A', 'B']
    const codes = new Set<string>()

    for (const q1 of opts) {
      for (const q2 of opts) {
        for (const q3 of opts) {
          for (const q4 of opts) {
            codes.add(calculatePersonality({ q1, q2, q3, q4 }).code)
          }
        }
      }
    }

    expect(codes.size).toBe(16)
    expect(codes.has('ENFP')).toBeTruthy()
    expect(codes.has('ISTJ')).toBeTruthy()
  })
})

describe('buildPersonaPromptFragment', () => {
  const answers: Answers = { q1: 'A', q2: 'A', q3: 'B', q4: 'B' }

  it('이름, 품종, 보호자 관계, 성격 결과가 모두 들어간다', () => {
    const out = buildPersonaPromptFragment({
      name: '마루',
      breed: '푸들',
      guardianRelationship: '누나',
      answers,
    })

    expect(out).toContain('나는 마루, 푸들이야.')
    expect(out).toContain('누나는 내 보호자야.')
    expect(out).toContain('ENFP · 문앞 탐험가')
  })

  it('4개 prompt_fragment 가 " / " 로 이어진다', () => {
    const out = buildPersonaPromptFragment({
      name: '마루',
      breed: '푸들',
      guardianRelationship: '누나',
      answers,
    })
    const sepCount = (out.match(/ \/ /g) || []).length
    expect(sepCount).toBe(3)
  })

  it('snapshot — 전체 출력 wording regression 가드', () => {
    const out = buildPersonaPromptFragment({
      name: '마루',
      breed: '푸들',
      guardianRelationship: '누나',
      answers,
    })

    expect(out).toBe(
      '나는 마루, 푸들이야. 누나는 내 보호자야.\n' +
        '내 성격 유형은 ENFP · 문앞 탐험가.\n' +
        '나를 한 줄로 말하면:\n' +
        '처음 보는 친구에게도 먼저 다가가 인사하는 외향적인 쪽이고' +
        ' / 새 장난감과 새 장소를 만나면 궁금해서 먼저 탐험하고' +
        ' / 보호자 표정과 목소리에 민감하게 반응하는 다정한 쪽이고' +
        ' / 바뀐 흐름에도 금방 맞추는 유연한 타입이야.',
    )
  })
})
