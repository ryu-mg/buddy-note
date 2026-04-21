import { describe, expect, it } from 'bun:test'

import {
  buildMilestoneCopy,
  daysSinceDate,
  getEligibleMilestones,
} from '@/lib/milestones/eligibility'

describe('daysSinceDate', () => {
  it('가입일을 1일째로 계산한다', () => {
    expect(
      daysSinceDate('2026-04-01T12:00:00+09:00', new Date('2026-04-01T23:00:00+09:00')),
    ).toBe(1)
  })

  it('잘못된 날짜는 0으로 방어한다', () => {
    expect(daysSinceDate('not-a-date', new Date('2026-04-22T00:00:00+09:00'))).toBe(0)
  })
})

describe('getEligibleMilestones', () => {
  it('7, 30, 100, 365일 마일스톤만 반환한다', () => {
    const eligible = getEligibleMilestones({
      createdAt: '2026-01-01T00:00:00+09:00',
      now: new Date('2026-04-10T00:00:00+09:00'),
    })

    expect(eligible.map((x) => x.day)).toEqual([7, 30, 100])
  })

  it('이미 생성된 milestone day는 중복 반환하지 않는다', () => {
    const eligible = getEligibleMilestones({
      createdAt: '2026-01-01T00:00:00+09:00',
      existingDays: [7, 30],
      now: new Date('2026-04-10T00:00:00+09:00'),
    })

    expect(eligible.map((x) => x.day)).toEqual([100])
  })
})

describe('buildMilestoneCopy', () => {
  it('각 milestone copy를 만든다', () => {
    expect(buildMilestoneCopy(365).title).toContain('1년')
  })
})
