import 'server-only'

import type { SupabaseClient } from '@supabase/supabase-js'

import {
  DEFAULT_DIARY_FONT_KEY,
  resolveDiaryFontPreset,
} from '@/lib/diary-fonts/presets'
import type { DiaryFontKey } from '@/types/database'

type DiaryFontRow = {
  font_key: string
}

export async function getPetDiaryFontKey(
  supabase: SupabaseClient,
  petId: string,
): Promise<DiaryFontKey> {
  const { data } = await supabase
    .from('pet_diary_font_settings')
    .select('font_key')
    .eq('pet_id', petId)
    .maybeSingle<DiaryFontRow>()

  return data ? resolveDiaryFontPreset(data.font_key).key : DEFAULT_DIARY_FONT_KEY
}
