import { describe, expect, it } from 'bun:test'

import { buildLogStats } from './stats'

describe('log stats', () => {
  it('summarizes started date, total count, active days, and date range', () => {
    const stats = buildLogStats({
      petCreatedAt: '2026-04-20T03:00:00.000Z',
      today: '2026-06-08',
      diaries: [
        { createdAt: '2026-06-08T10:00:00.000Z', logDate: '2026-06-08' },
        { createdAt: '2026-06-02T10:00:00.000Z', logDate: '2026-06-02' },
        { createdAt: '2026-05-31T10:00:00.000Z', logDate: '2026-05-31' },
        { createdAt: '2026-05-31T11:00:00.000Z', logDate: '2026-05-31' },
      ],
    })

    expect(stats.startedDate).toBe('2026-04-20')
    expect(stats.daysSinceStarted).toBe(50)
    expect(stats.totalCount).toBe(4)
    expect(stats.activeDayCount).toBe(3)
    expect(stats.firstDiaryDate).toBe('2026-05-31')
    expect(stats.latestDiaryDate).toBe('2026-06-08')
  })

  it('builds recent month buckets with stable zero-count months', () => {
    const stats = buildLogStats({
      petCreatedAt: '2026-01-01T00:00:00.000Z',
      today: '2026-06-08',
      diaries: [
        { createdAt: '2026-06-08T10:00:00.000Z', logDate: '2026-06-08' },
        { createdAt: '2026-06-02T10:00:00.000Z', logDate: '2026-06-02' },
        { createdAt: '2026-04-10T10:00:00.000Z', logDate: '2026-04-10' },
      ],
    })

    expect(stats.monthBuckets.map((bucket) => bucket.key)).toEqual([
      '2026-01',
      '2026-02',
      '2026-03',
      '2026-04',
      '2026-05',
      '2026-06',
    ])
    expect(stats.monthBuckets.map((bucket) => bucket.count)).toEqual([
      0, 0, 0, 1, 0, 2,
    ])
    expect(stats.monthBuckets.at(-1)?.ratio).toBe(1)
  })

  it('counts weekday rhythm from log dates', () => {
    const stats = buildLogStats({
      petCreatedAt: '2026-01-01T00:00:00.000Z',
      today: '2026-06-08',
      diaries: [
        { createdAt: '2026-06-08T10:00:00.000Z', logDate: '2026-06-08' },
        { createdAt: '2026-06-01T10:00:00.000Z', logDate: '2026-06-01' },
        { createdAt: '2026-06-03T10:00:00.000Z', logDate: '2026-06-03' },
      ],
    })

    expect(stats.weekdayBuckets.map((bucket) => bucket.label)).toEqual([
      '월',
      '화',
      '수',
      '목',
      '금',
      '토',
      '일',
    ])
    expect(stats.weekdayBuckets.map((bucket) => bucket.count)).toEqual([
      2, 0, 1, 0, 0, 0, 0,
    ])
  })
})
