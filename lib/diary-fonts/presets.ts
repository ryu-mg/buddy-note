import type { DiaryFontKey } from '@/types/database'

export type DiaryFontPreset = {
  key: DiaryFontKey
  label: string
  description: string
  cssValue: string
}

export const DEFAULT_DIARY_FONT_KEY: DiaryFontKey = 'buddy_hand'

export const DIARY_FONT_PRESETS: DiaryFontPreset[] = [
  {
    key: 'buddy_hand',
    label: '버디 손글씨',
    description: '강아지가 직접 남기는 느낌을 가장 잘 살려요.',
    cssValue: 'var(--font-diary-body)',
  },
  {
    key: 'line_seed',
    label: '단정한 기록체',
    description: '짧은 일기를 또렷하게 읽고 싶을 때 좋아요.',
    cssValue: 'var(--font-sans)',
  },
  {
    key: 'maru_buri',
    label: '앨범 명조체',
    description: '오래 보관하는 사진첩처럼 차분하게 보여요.',
    cssValue: 'var(--font-serif)',
  },
]

export function resolveDiaryFontPreset(key: unknown): DiaryFontPreset {
  return (
    DIARY_FONT_PRESETS.find((preset) => preset.key === key) ??
    DIARY_FONT_PRESETS[0]
  )
}
