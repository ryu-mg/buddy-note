import { describe, expect, it } from 'bun:test'

import {
  DEFAULT_THEME_PRESET_KEY,
  THEME_PRESETS,
  THEME_PRESET_KEYS,
  resolveThemePreset,
  type ThemePresetKey,
} from '@/lib/themes/presets'

describe('theme presets', () => {
  it('defines the five allowed presets in a stable order', () => {
    expect(THEME_PRESET_KEYS).toEqual([
      'classic_terracotta',
      'field_green',
      'morning_gold',
      'quiet_umber',
      'mist_blue',
    ] satisfies ThemePresetKey[])
  })

  it('keeps classic terracotta as the default', () => {
    expect(DEFAULT_THEME_PRESET_KEY).toBe('classic_terracotta')
    expect(resolveThemePreset(null).key).toBe('classic_terracotta')
    expect(resolveThemePreset('unknown-theme').key).toBe('classic_terracotta')
  })

  it('defines semantic theme tokens for every preset', () => {
    for (const preset of THEME_PRESETS) {
      expect(preset.label.length).toBeGreaterThan(0)
      expect(preset.colors.accent).toMatch(/^#[0-9a-f]{6}$/)
      expect(preset.colors.accentSoft).toMatch(/^#[0-9a-f]{6}$/)
      expect(preset.colors.paper).toMatch(/^#[0-9a-f]{6}$/)
      expect(preset.colors.moodHint).toMatch(/^#[0-9a-f]{6}$/)
    }
  })

  it('does not include purple or violet leaning presets', () => {
    for (const preset of THEME_PRESETS) {
      const copy = `${preset.key} ${preset.label} ${preset.description}`
      expect(copy).not.toMatch(/purple|violet|보라|바이올렛/i)
      const hexValues = Object.values(preset.colors)
      expect(hexValues).not.toContain('#800080')
      expect(hexValues).not.toContain('#8b5cf6')
      expect(hexValues).not.toContain('#a855f7')
    }
  })
})
