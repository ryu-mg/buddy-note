import { describe, expect, it } from 'bun:test'

import { buildThemeStyle } from '@/lib/themes/style'

describe('buildThemeStyle', () => {
  it('maps a preset to scoped CSS variables', () => {
    expect(buildThemeStyle('field_green')).toEqual({
      '--theme-accent': '#6f9f86',
      '--theme-accent-soft': '#e4f0e8',
      '--theme-paper': '#fbfbf2',
      '--theme-mood-hint': '#4a7c59',
    })
  })

  it('falls back to classic terracotta for unknown keys', () => {
    expect(buildThemeStyle('unknown')['--theme-accent']).toBe('#e07a5f')
  })
})
