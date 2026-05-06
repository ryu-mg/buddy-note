export const THEME_PRESET_KEYS = [
  'classic_terracotta',
  'field_green',
  'morning_gold',
  'quiet_umber',
  'mist_blue',
] as const

export type ThemePresetKey = (typeof THEME_PRESET_KEYS)[number]

export type ThemePreset = {
  key: ThemePresetKey
  label: string
  description: string
  colors: {
    accent: string
    accentSoft: string
    paper: string
    moodHint: string
  }
}

export const DEFAULT_THEME_PRESET_KEY: ThemePresetKey = 'classic_terracotta'

export const THEME_PRESETS: ThemePreset[] = [
  {
    key: 'classic_terracotta',
    label: '클래식 테라코타',
    description: 'buddy-note의 기본 폴라로이드 무드',
    colors: {
      accent: '#e07a5f',
      accentSoft: '#fde6e0',
      paper: '#fafaf5',
      moodHint: '#b85038',
    },
  },
  {
    key: 'field_green',
    label: '필드 그린',
    description: '산책길과 잔디가 떠오르는 차분한 앨범',
    colors: {
      accent: '#6f9f86',
      accentSoft: '#e4f0e8',
      paper: '#fbfbf2',
      moodHint: '#4a7c59',
    },
  },
  {
    key: 'morning_gold',
    label: '모닝 골드',
    description: '아침 햇살처럼 밝은 기록',
    colors: {
      accent: '#d4a256',
      accentSoft: '#f8ead0',
      paper: '#fffaf0',
      moodHint: '#e0a83f',
    },
  },
  {
    key: 'quiet_umber',
    label: '콰이어트 엄버',
    description: '조용한 갈색 필름 같은 앨범',
    colors: {
      accent: '#8a6650',
      accentSoft: '#eadfd8',
      paper: '#fbf7f1',
      moodHint: '#6f503f',
    },
  },
  {
    key: 'mist_blue',
    label: '미스트 블루',
    description: '낮은 채도의 푸른 회색 무드',
    colors: {
      accent: '#5f8aa8',
      accentSoft: '#dfeaf0',
      paper: '#f7faf9',
      moodHint: '#7f8f9f',
    },
  },
]

const PRESET_BY_KEY = new Map(THEME_PRESETS.map((preset) => [preset.key, preset]))

export function isThemePresetKey(value: unknown): value is ThemePresetKey {
  return (
    typeof value === 'string' &&
    (THEME_PRESET_KEYS as readonly string[]).includes(value)
  )
}

export function resolveThemePreset(value: unknown): ThemePreset {
  if (isThemePresetKey(value)) {
    return PRESET_BY_KEY.get(value) ?? THEME_PRESETS[0]
  }
  return PRESET_BY_KEY.get(DEFAULT_THEME_PRESET_KEY) ?? THEME_PRESETS[0]
}
