import { describe, it, expect } from 'bun:test'

import { buildCallbacksForDiary } from '@/lib/llm/build-callbacks-for-diary'

const validCallback = (note: string, date = '2026-04-20') => ({
  note,
  source: 'log' as const,
  referenceDate: date,
})

describe('buildCallbacksForDiary', () => {
  it('null summary → []', () => {
    expect(buildCallbacksForDiary(null)).toEqual([])
  })

  it('recent_callbacks=null → []', () => {
    expect(buildCallbacksForDiary({ recent_callbacks: null })).toEqual([])
  })

  it('recent_callbacks=undefined → []', () => {
    expect(buildCallbacksForDiary({ recent_callbacks: undefined })).toEqual([])
  })

  it('빈 배열 → []', () => {
    expect(buildCallbacksForDiary({ recent_callbacks: [] })).toEqual([])
  })

  it('array 가 아닌 값 → [] (zod safeParse 실패)', () => {
    expect(
      buildCallbacksForDiary({ recent_callbacks: 'not an array' }),
    ).toEqual([])
    expect(
      buildCallbacksForDiary({ recent_callbacks: { foo: 'bar' } }),
    ).toEqual([])
    expect(buildCallbacksForDiary({ recent_callbacks: 42 })).toEqual([])
  })

  it('valid 배열 3개 → note 문자열 3개를 순서대로', () => {
    const out = buildCallbacksForDiary({
      recent_callbacks: [
        validCallback('첫 기록'),
        validCallback('두번째 기록'),
        validCallback('세번째 기록'),
      ],
    })
    expect(out).toEqual(['첫 기록', '두번째 기록', '세번째 기록'])
  })

  it('valid 배열 10개 → 앞 5개로 잘림', () => {
    const many = Array.from({ length: 10 }, (_, i) =>
      validCallback(`callback-${i}`),
    )
    const out = buildCallbacksForDiary({ recent_callbacks: many })
    expect(out).toHaveLength(5)
    expect(out).toEqual([
      'callback-0',
      'callback-1',
      'callback-2',
      'callback-3',
      'callback-4',
    ])
  })

  it('하나라도 malformed 항목이 섞이면 배열 전체 거절 → []', () => {
    const out = buildCallbacksForDiary({
      recent_callbacks: [
        validCallback('정상'),
        { note: '', source: 'log', referenceDate: '2026-04-20' }, // note 빈값 → 실패
        validCallback('또 정상'),
      ],
    })
    expect(out).toEqual([])
  })

  it('referenceDate 포맷이 틀리면 전체 거절 → []', () => {
    const out = buildCallbacksForDiary({
      recent_callbacks: [
        validCallback('정상'),
        { note: 'ok', source: 'log', referenceDate: '20260420' }, // 포맷 실패
      ],
    })
    expect(out).toEqual([])
  })

  it('source enum 밖이면 전체 거절 → []', () => {
    const out = buildCallbacksForDiary({
      recent_callbacks: [
        { note: 'ok', source: 'memo', referenceDate: '2026-04-20' },
      ],
    })
    expect(out).toEqual([])
  })
})
