import { describe, expect, it } from 'bun:test'

import { validateThemeKey } from '@/lib/themes/validation'

describe('validateThemeKey', () => {
  it('accepts a known theme key', () => {
    expect(validateThemeKey('field_green')).toEqual({
      ok: true,
      themeKey: 'field_green',
    })
  })

  it('rejects unknown theme keys with Korean copy', () => {
    expect(validateThemeKey('purple')).toEqual({
      ok: false,
      error: '테마를 다시 선택해주세요.',
    })
  })
})
