import 'server-only'

/**
 * Font loading for satori. satori does NOT fetch fonts at render time —
 * we must provide font buffers up front. We fetch from stable CDN URLs
 * on first call and cache in module memory for the lifetime of the
 * serverless instance.
 *
 * Font sources:
 *   - Pretendard SemiBold (Korean UI) from jsDelivr mirror of the official
 *     orioncactus/pretendard release.
 *   - Nanum Myeongjo Regular (Korean serif) from jsDelivr mirror of the
 *     google/fonts repo.
 *
 * If fetching fails (offline build, CDN outage) we return an empty array
 * and satori falls back to its default sans font. Worst case the shared
 * image still renders — just without the polaroid typography.
 */

type SatoriFont = {
  name: string
  data: ArrayBuffer
  weight: 400 | 600
  style: 'normal'
}

const PRETENDARD_SEMIBOLD_URL =
  'https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/packages/pretendard/dist/public/static/Pretendard-SemiBold.otf'

// Google Fonts repo on GitHub, mirrored via jsDelivr. Stable URL for the
// regular weight TTF.
const NANUM_MYEONGJO_REGULAR_URL =
  'https://cdn.jsdelivr.net/gh/google/fonts@main/ofl/nanummyeongjo/NanumMyeongjo-Regular.ttf'

let cache: SatoriFont[] | null = null

export async function loadFonts(): Promise<SatoriFont[]> {
  if (cache) return cache

  const fetched = await Promise.allSettled([
    fetchFont(PRETENDARD_SEMIBOLD_URL),
    fetchFont(NANUM_MYEONGJO_REGULAR_URL),
  ])

  const fonts: SatoriFont[] = []
  if (fetched[0].status === 'fulfilled') {
    fonts.push({
      name: 'Pretendard',
      data: fetched[0].value,
      weight: 600,
      style: 'normal',
    })
  }
  if (fetched[1].status === 'fulfilled') {
    fonts.push({
      name: 'Nanum Myeongjo',
      data: fetched[1].value,
      weight: 400,
      style: 'normal',
    })
  }

  cache = fonts
  return fonts
}

async function fetchFont(url: string): Promise<ArrayBuffer> {
  const res = await fetch(url, { cache: 'force-cache' })
  if (!res.ok) throw new Error(`font fetch failed: ${url} ${res.status}`)
  return await res.arrayBuffer()
}
