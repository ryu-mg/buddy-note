export type LogStatsDiary = {
  createdAt: string
  logDate: string | null
}

export type CountBucket = {
  key: string
  label: string
  count: number
  ratio: number
}

export type LogStats = {
  startedDate: string
  daysSinceStarted: number
  totalCount: number
  activeDayCount: number
  firstDiaryDate: string | null
  latestDiaryDate: string | null
  monthBuckets: CountBucket[]
  weekdayBuckets: CountBucket[]
}

type BuildLogStatsInput = {
  petCreatedAt: string
  diaries: LogStatsDiary[]
  today?: string
}

const WEEKDAY_LABELS = ['월', '화', '수', '목', '금', '토', '일'] as const

export function buildLogStats({
  petCreatedAt,
  diaries,
  today = toDateKey(new Date()),
}: BuildLogStatsInput): LogStats {
  const startedDate = toDateKey(petCreatedAt)
  const dateKeys = diaries
    .map((diary) => diary.logDate ?? toDateKey(diary.createdAt))
    .filter(isValidDateKey)
    .sort()
  const uniqueDateKeys = new Set(dateKeys)

  return {
    startedDate,
    daysSinceStarted: daysBetweenInclusive(startedDate, today),
    totalCount: diaries.length,
    activeDayCount: uniqueDateKeys.size,
    firstDiaryDate: dateKeys.at(0) ?? null,
    latestDiaryDate: dateKeys.at(-1) ?? null,
    monthBuckets: buildMonthBuckets(dateKeys, today),
    weekdayBuckets: buildWeekdayBuckets(dateKeys),
  }
}

function buildMonthBuckets(dateKeys: string[], today: string): CountBucket[] {
  const counts = new Map<string, number>()
  for (const dateKey of dateKeys) {
    const key = dateKey.slice(0, 7)
    counts.set(key, (counts.get(key) ?? 0) + 1)
  }

  const keys = recentMonthKeys(today, 6)
  const maxCount = Math.max(1, ...keys.map((key) => counts.get(key) ?? 0))

  return keys.map((key) => {
    const count = counts.get(key) ?? 0
    return {
      key,
      label: monthLabel(key),
      count,
      ratio: count / maxCount,
    }
  })
}

function buildWeekdayBuckets(dateKeys: string[]): CountBucket[] {
  const counts = Array.from({ length: 7 }, () => 0)
  for (const dateKey of dateKeys) {
    const date = parseDateKey(dateKey)
    if (!date) continue
    const mondayFirstIndex = (date.getUTCDay() + 6) % 7
    counts[mondayFirstIndex] += 1
  }

  const maxCount = Math.max(1, ...counts)

  return WEEKDAY_LABELS.map((label, index) => ({
    key: String(index),
    label,
    count: counts[index],
    ratio: counts[index] / maxCount,
  }))
}

function recentMonthKeys(today: string, count: number): string[] {
  const date = parseDateKey(`${today.slice(0, 7)}-01`) ?? new Date()
  const keys: string[] = []

  for (let offset = count - 1; offset >= 0; offset -= 1) {
    const month = new Date(
      Date.UTC(date.getUTCFullYear(), date.getUTCMonth() - offset, 1),
    )
    keys.push(
      `${month.getUTCFullYear()}-${String(month.getUTCMonth() + 1).padStart(2, '0')}`,
    )
  }

  return keys
}

function monthLabel(monthKey: string): string {
  const month = Number(monthKey.slice(5, 7))
  return Number.isFinite(month) ? `${month}월` : monthKey
}

function daysBetweenInclusive(start: string, end: string): number {
  const startDate = parseDateKey(start)
  const endDate = parseDateKey(end)
  if (!startDate || !endDate) return 0

  const diff = endDate.getTime() - startDate.getTime()
  if (diff < 0) return 0

  return Math.floor(diff / 86_400_000) + 1
}

function toDateKey(value: string | Date): string {
  const date = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(date.getTime())) return ''

  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Seoul',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date)
}

function parseDateKey(value: string): Date | null {
  if (!isValidDateKey(value)) return null

  const date = new Date(`${value}T00:00:00.000Z`)
  return Number.isNaN(date.getTime()) ? null : date
}

function isValidDateKey(value: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(value)
}
