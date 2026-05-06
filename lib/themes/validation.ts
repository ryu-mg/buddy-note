import { isThemePresetKey, type ThemePresetKey } from '@/lib/themes/presets'

export type ThemeValidationResult =
  | { ok: true; themeKey: ThemePresetKey }
  | { ok: false; error: string }

export function validateThemeKey(value: unknown): ThemeValidationResult {
  if (isThemePresetKey(value)) {
    return { ok: true, themeKey: value }
  }

  return {
    ok: false,
    error: '테마를 다시 선택해주세요.',
  }
}
