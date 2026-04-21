import type { DiaryMood } from '@/types/database'

export const DIARY_MOODS = [
  'bright',
  'calm',
  'tired',
  'curious',
  'grumpy',
  'lonely',
] as const satisfies readonly DiaryMood[]

export const FALLBACK_DIARY_MOOD: DiaryMood = 'calm'

export const MOOD_LABELS: Record<DiaryMood, string> = {
  bright: '반짝이는 날',
  calm: '포근한 날',
  tired: '졸린 날',
  curious: '궁금한 날',
  grumpy: '삐죽한 날',
  lonely: '기다린 날',
}

export const MOOD_CSS_VAR: Record<DiaryMood, string> = {
  bright: 'var(--color-mood-bright)',
  calm: 'var(--color-mood-calm)',
  tired: 'var(--color-mood-tired)',
  curious: 'var(--color-mood-curious)',
  grumpy: 'var(--color-mood-grumpy)',
  lonely: 'var(--color-mood-lonely)',
}

export function isDiaryMood(value: unknown): value is DiaryMood {
  return typeof value === 'string' && DIARY_MOODS.includes(value as DiaryMood)
}
