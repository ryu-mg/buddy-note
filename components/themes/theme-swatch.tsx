import type { ThemePreset } from '@/lib/themes/presets'

export function ThemeSwatch({ preset }: { preset: ThemePreset }) {
  return (
    <span
      aria-hidden
      className="grid size-11 shrink-0 grid-cols-2 overflow-hidden rounded-[var(--radius-input)] ring-1 ring-[var(--color-line)]"
    >
      <span style={{ backgroundColor: preset.colors.paper }} />
      <span style={{ backgroundColor: preset.colors.accentSoft }} />
      <span style={{ backgroundColor: preset.colors.accent }} />
      <span style={{ backgroundColor: preset.colors.moodHint }} />
    </span>
  )
}
