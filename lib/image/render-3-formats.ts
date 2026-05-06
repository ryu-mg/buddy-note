import 'server-only'

import { renderPolaroid } from '@/lib/image/render-polaroid'

/**
 * Fan out the polaroid render to all 3 SNS share ratios in parallel.
 *
 * Per AGENTS.md pipeline budget (§4 Architecture 30-second target):
 *   satori 3포맷 3-5s 병렬 via Promise.all
 *
 * Returns a map keyed by ratio. Consumers upload the PNGs to the
 * `diary-images` bucket and persist the resulting URLs on
 * `diaries.image_url_{916,45,11}`.
 */

type RenderInput = {
  photoUrl?: string | null
  petName: string
  diaryTitle: string
  diaryBody: string
  themeKey?: string | null
}

export type ThreeFormatResult = {
  '9:16': Buffer
  '4:5': Buffer
  '1:1': Buffer
}

export async function renderAllFormats(
  input: RenderInput,
): Promise<ThreeFormatResult> {
  const [s916, s45, s11] = await Promise.all([
    renderPolaroid({ ...input, format: '9:16' }),
    renderPolaroid({ ...input, format: '4:5' }),
    renderPolaroid({ ...input, format: '1:1' }),
  ])
  return {
    '9:16': s916,
    '4:5': s45,
    '1:1': s11,
  }
}
