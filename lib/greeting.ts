import type { PersonalityCode } from '@/lib/pet-mbti'

type GreetingInput = {
  now?: Date
  personalityCode?: string | null
}

const EXTROVERTED_CODES = new Set<PersonalityCode>([
  'ESTP',
  'ESFP',
  'ENFP',
  'ENTP',
  'ESTJ',
  'ESFJ',
  'ENFJ',
  'ENTJ',
])

const ROUTINE_CODES = new Set<PersonalityCode>([
  'ISTJ',
  'ISFJ',
  'INFJ',
  'INTJ',
  'ESTJ',
  'ESFJ',
  'ENFJ',
  'ENTJ',
])

export function buildBuddyGreeting(input: GreetingInput = {}): string {
  const now = input.now ?? new Date()
  const hour = seoulHour(now)
  const code = input.personalityCode as PersonalityCode | null | undefined

  if (hour < 11) {
    return ROUTINE_CODES.has(code ?? 'INFP')
      ? '오늘도 내 루틴부터 차근차근 시작해볼게.'
      : '아침 냄새가 좋아서 벌써 궁금해졌어.'
  }

  if (hour < 17) {
    return EXTROVERTED_CODES.has(code ?? 'INFP')
      ? '오늘은 누구를 만났는지 내가 먼저 들려줄게.'
      : '조용히 모아둔 오늘 얘기를 꺼내볼게.'
  }

  if (hour < 22) {
    return '오늘 하루, 내가 본 장면을 버디노트에 남겨둘게.'
  }

  return '졸리지만 오늘 마음은 잊지 않게 적어둘게.'
}

function seoulHour(date: Date): number {
  const hour = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Seoul',
    hour: '2-digit',
    hourCycle: 'h23',
  }).format(date)
  return Number.parseInt(hour, 10)
}
