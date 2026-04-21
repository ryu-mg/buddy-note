export const MILESTONE_DAYS = [7, 30, 100, 365] as const

export type MilestoneDay = (typeof MILESTONE_DAYS)[number]

export type MilestoneCandidate = {
  day: MilestoneDay
  title: string
  caption: string
}

export function daysSinceDate(startDate: string, now: Date = new Date()): number {
  const start = new Date(startDate)
  if (Number.isNaN(start.getTime())) return 0

  const startUtc = Date.UTC(start.getFullYear(), start.getMonth(), start.getDate())
  const nowUtc = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate())
  return Math.max(0, Math.floor((nowUtc - startUtc) / 86_400_000) + 1)
}

export function getEligibleMilestones(input: {
  createdAt: string
  existingDays?: number[]
  now?: Date
}): MilestoneCandidate[] {
  const elapsed = daysSinceDate(input.createdAt, input.now)
  const existing = new Set(input.existingDays ?? [])

  return MILESTONE_DAYS.filter((day) => elapsed >= day && !existing.has(day)).map(
    buildMilestoneCopy,
  )
}

export function buildMilestoneCopy(day: MilestoneDay): MilestoneCandidate {
  const titleByDay: Record<MilestoneDay, string> = {
    7: '우리 일주일 됐어',
    30: '한 달치 마음을 모았어',
    100: '백 번째 발자국 근처야',
    365: '우리의 1년을 기억해',
  }

  const captionByDay: Record<MilestoneDay, string> = {
    7: '처음 남긴 장면들이 벌써 내 이야기가 됐어.',
    30: '매일 조금씩 쌓인 내가 이제 더 선명해졌어.',
    100: '사진과 문장 사이에 우리만 아는 습관이 남았어.',
    365: '1년 동안 내가 본 세상을 한 장으로 접어둘게.',
  }

  return {
    day,
    title: titleByDay[day],
    caption: captionByDay[day],
  }
}
