import 'server-only'

import type { SupabaseClient } from '@supabase/supabase-js'

import {
  DEFAULT_THEME_PRESET_KEY,
  resolveThemePreset,
  type ThemePresetKey,
} from '@/lib/themes/presets'

type ThemeRow = {
  theme_key: string
}

export async function getPetThemeKey(
  supabase: SupabaseClient,
  petId: string,
): Promise<ThemePresetKey> {
  const { data } = await supabase
    .from('pet_theme_settings')
    .select('theme_key')
    .eq('pet_id', petId)
    .maybeSingle<ThemeRow>()

  return data ? resolveThemePreset(data.theme_key).key : DEFAULT_THEME_PRESET_KEY
}
