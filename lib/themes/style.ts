import { resolveThemePreset } from '@/lib/themes/presets'

export type ThemeStyleVars = {
  '--theme-accent': string
  '--theme-accent-soft': string
  '--theme-paper': string
  '--theme-mood-hint': string
}

export function buildThemeStyle(themeKey: unknown): ThemeStyleVars {
  const preset = resolveThemePreset(themeKey)

  return {
    '--theme-accent': preset.colors.accent,
    '--theme-accent-soft': preset.colors.accentSoft,
    '--theme-paper': preset.colors.paper,
    '--theme-mood-hint': preset.colors.moodHint,
  }
}
