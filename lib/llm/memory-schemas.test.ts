import { describe, it, expect } from 'bun:test'

import {
  memorySummaryInputSchema,
  memorySummarySchema,
  previousSummaryInputSchema,
  recentCallbackSchema,
} from '@/lib/llm/memory-schemas'

// --------------------------------------------------------------------------
// recentCallbackSchema
// --------------------------------------------------------------------------

describe('recentCallbackSchema', () => {
  it('유효한 payload 파싱', () => {
    const r = recentCallbackSchema.safeParse({
      note: '공원에서 새 친구 만났던 날',
      source: 'log',
      referenceDate: '2026-04-20',
    })
    expect(r.success).toBeTruthy()
  })

  it('source=diary 도 허용', () => {
    const r = recentCallbackSchema.safeParse({
      note: '첫 미용 한 날',
      source: 'diary',
      referenceDate: '2026-04-01',
    })
    expect(r.success).toBeTruthy()
  })

  it('source 가 enum 밖이면 실패', () => {
    const r = recentCallbackSchema.safeParse({
      note: 'note',
      source: 'memo', // invalid
      referenceDate: '2026-04-20',
    })
    expect(r.success).toBeFalsy()
  })

  it('note 40자 초과면 실패', () => {
    const r = recentCallbackSchema.safeParse({
      note: 'a'.repeat(41),
      source: 'log',
      referenceDate: '2026-04-20',
    })
    expect(r.success).toBeFalsy()
  })

  it('note 빈 문자열이면 실패 (min 1)', () => {
    const r = recentCallbackSchema.safeParse({
      note: '',
      source: 'log',
      referenceDate: '2026-04-20',
    })
    expect(r.success).toBeFalsy()
  })

  it('referenceDate 가 YYYY-MM-DD 가 아니면 실패', () => {
    const r = recentCallbackSchema.safeParse({
      note: 'note',
      source: 'log',
      referenceDate: '2026/04/20',
    })
    expect(r.success).toBeFalsy()
  })

  it('필수 필드 누락 시 실패', () => {
    const r = recentCallbackSchema.safeParse({ note: 'n', source: 'log' })
    expect(r.success).toBeFalsy()
  })
})

// --------------------------------------------------------------------------
// memorySummarySchema (LLM 출력)
// --------------------------------------------------------------------------

describe('memorySummarySchema', () => {
  const valid = {
    toneDescription: '밝고 호기심 많은 아이',
    recurringHabits: ['아침마다 현관 앞에서 기다리기'],
    favoriteThings: ['산책', '간식'],
    recentCallbacks: [
      {
        note: '어제 물웅덩이 건넌 기록',
        source: 'log' as const,
        referenceDate: '2026-04-19',
      },
    ],
  }

  it('유효 payload 파싱', () => {
    const r = memorySummarySchema.safeParse(valid)
    expect(r.success).toBeTruthy()
  })

  it('toneDescription 은 빈 문자열 허용 (첫 갱신 시 pass-through)', () => {
    const r = memorySummarySchema.safeParse({
      ...valid,
      toneDescription: '',
    })
    expect(r.success).toBeTruthy()
  })

  it('toneDescription 200자 초과면 실패', () => {
    const r = memorySummarySchema.safeParse({
      ...valid,
      toneDescription: 'a'.repeat(201),
    })
    expect(r.success).toBeFalsy()
  })

  it('recurringHabits 한 항목이 30자 초과면 실패', () => {
    const r = memorySummarySchema.safeParse({
      ...valid,
      recurringHabits: ['a'.repeat(31)],
    })
    expect(r.success).toBeFalsy()
  })

  it('recurringHabits 빈 문자열 항목은 실패 (min 1)', () => {
    const r = memorySummarySchema.safeParse({
      ...valid,
      recurringHabits: [''],
    })
    expect(r.success).toBeFalsy()
  })

  it('recurringHabits 9개 초과면 실패 (max 8)', () => {
    const r = memorySummarySchema.safeParse({
      ...valid,
      recurringHabits: Array.from({ length: 9 }, (_, i) => `habit-${i}`),
    })
    expect(r.success).toBeFalsy()
  })

  it('favoriteThings 9개 초과면 실패 (max 8)', () => {
    const r = memorySummarySchema.safeParse({
      ...valid,
      favoriteThings: Array.from({ length: 9 }, (_, i) => `fav-${i}`),
    })
    expect(r.success).toBeFalsy()
  })

  it('recentCallbacks 6개면 실패 (max 5)', () => {
    const callback = {
      note: '과거 기록',
      source: 'log' as const,
      referenceDate: '2026-04-01',
    }
    const r = memorySummarySchema.safeParse({
      ...valid,
      recentCallbacks: Array.from({ length: 6 }, () => callback),
    })
    expect(r.success).toBeFalsy()
  })

  it('필수 필드가 빠지면 실패', () => {
    const missing = {
      recurringHabits: valid.recurringHabits,
      favoriteThings: valid.favoriteThings,
      recentCallbacks: valid.recentCallbacks,
    }
    const r = memorySummarySchema.safeParse(missing)
    expect(r.success).toBeFalsy()
  })
})

// --------------------------------------------------------------------------
// previousSummaryInputSchema
// --------------------------------------------------------------------------

describe('previousSummaryInputSchema', () => {
  it('전부 null/기본값이어도 통과', () => {
    const r = previousSummaryInputSchema.safeParse({
      tone_description: null,
      recurring_habits: [],
      favorite_things: [],
      recent_callbacks: [],
    })
    expect(r.success).toBeTruthy()
  })

  it('tone_description 200자 초과면 실패', () => {
    const r = previousSummaryInputSchema.safeParse({
      tone_description: 'a'.repeat(201),
      recurring_habits: [],
      favorite_things: [],
      recent_callbacks: [],
    })
    expect(r.success).toBeFalsy()
  })

  it('default: array 필드는 누락 시 빈 배열로 채워짐', () => {
    const r = previousSummaryInputSchema.safeParse({
      tone_description: null,
    })
    expect(r.success).toBeTruthy()
    if (r.success) {
      expect(r.data.recurring_habits).toEqual([])
      expect(r.data.favorite_things).toEqual([])
      expect(r.data.recent_callbacks).toEqual([])
    }
  })
})

// --------------------------------------------------------------------------
// memorySummaryInputSchema
// --------------------------------------------------------------------------

describe('memorySummaryInputSchema', () => {
  const base = {
    petName: '마루',
    breed: '푸들',
    personaFragment: '나는 마루, 푸들이야. ...',
    previousSummary: null,
    newLogs: [],
  }

  it('newLogs 빈 배열 — 통과 (LLM 호출 스킵 의도)', () => {
    const r = memorySummaryInputSchema.safeParse(base)
    expect(r.success).toBeTruthy()
  })

  it('petName 누락 시 실패', () => {
    const missing = {
      breed: base.breed,
      personaFragment: base.personaFragment,
      previousSummary: base.previousSummary,
      newLogs: base.newLogs,
    }
    const r = memorySummaryInputSchema.safeParse(missing)
    expect(r.success).toBeFalsy()
  })

  it('personaFragment 누락 시 실패', () => {
    const missing = {
      petName: base.petName,
      breed: base.breed,
      previousSummary: base.previousSummary,
      newLogs: base.newLogs,
    }
    const r = memorySummaryInputSchema.safeParse(missing)
    expect(r.success).toBeFalsy()
  })

  it('petName 이 공백만이면 실패 (trim 후 min 1)', () => {
    const r = memorySummaryInputSchema.safeParse({ ...base, petName: '   ' })
    expect(r.success).toBeFalsy()
  })

  it('petName 25자 초과면 실패 (max 24)', () => {
    const r = memorySummaryInputSchema.safeParse({
      ...base,
      petName: 'a'.repeat(25),
    })
    expect(r.success).toBeFalsy()
  })

  it('newLogs 21건이면 실패 (max 20)', () => {
    const log = {
      createdAt: '2026-04-20T00:00:00Z',
      tags: [],
      memo: null,
    }
    const r = memorySummaryInputSchema.safeParse({
      ...base,
      newLogs: Array.from({ length: 21 }, () => log),
    })
    expect(r.success).toBeFalsy()
  })

  it('breed 생략 OK (optional)', () => {
    const withoutBreed = {
      petName: base.petName,
      personaFragment: base.personaFragment,
      previousSummary: base.previousSummary,
      newLogs: base.newLogs,
    }
    const r = memorySummaryInputSchema.safeParse(withoutBreed)
    expect(r.success).toBeTruthy()
  })

  it('previousSummary 에 valid payload 를 주면 통과', () => {
    const r = memorySummaryInputSchema.safeParse({
      ...base,
      previousSummary: {
        tone_description: '차분한 아이',
        recurring_habits: ['아침 산책'],
        favorite_things: ['공'],
        recent_callbacks: [],
      },
    })
    expect(r.success).toBeTruthy()
  })
})
