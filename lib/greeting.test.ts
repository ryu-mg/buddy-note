import { describe, expect, it } from 'bun:test'

import { buildBuddyGreeting } from '@/lib/greeting'

describe('buildBuddyGreeting', () => {
  it('아침에는 루틴형 성격에 맞춘 인사를 만든다', () => {
    expect(
      buildBuddyGreeting({
        now: new Date('2026-04-22T08:00:00+09:00'),
        personalityCode: 'ISTJ',
      }),
    ).toContain('루틴')
  })

  it('낮에는 외향형 성격에 맞춘 인사를 만든다', () => {
    expect(
      buildBuddyGreeting({
        now: new Date('2026-04-22T13:00:00+09:00'),
        personalityCode: 'ENFP',
      }),
    ).toContain('누구를 만났는지')
  })

  it('밤에는 기록 완료 맥락의 인사를 만든다', () => {
    expect(
      buildBuddyGreeting({ now: new Date('2026-04-22T23:00:00+09:00') }),
    ).toContain('졸리지만')
  })
})
