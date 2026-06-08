import { describe, expect, it } from 'bun:test'

import {
  DEFAULT_DIARY_FONT_KEY,
  DIARY_FONT_PRESETS,
  resolveDiaryFontPreset,
} from '@/lib/diary-fonts/presets'

describe('diary font presets', () => {
  it('has a stable default hand font', () => {
    expect(DEFAULT_DIARY_FONT_KEY).toBe('buddy_hand')
    expect(resolveDiaryFontPreset('unknown').key).toBe('buddy_hand')
  })

  it('defines selectable membership font choices', () => {
    expect(DIARY_FONT_PRESETS.map((preset) => preset.key)).toEqual([
      'buddy_hand',
      'line_seed',
      'maru_buri',
    ])
  })
})
