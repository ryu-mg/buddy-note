import type { DiaryRow } from '@/types/database'

export const DIARY_IMAGES_BUCKET = 'diary-images'

type DiaryImageColumns = Pick<
  DiaryRow,
  'image_url_916' | 'image_url_45' | 'image_url_11'
>

const PUBLIC_BUCKET_PATH = `/storage/v1/object/public/${DIARY_IMAGES_BUCKET}/`

function lastPathSegment(path: string): string | null {
  const normalized = path.split('?')[0]?.split('#')[0] ?? ''
  const segment = normalized.split('/').filter(Boolean).at(-1)
  if (!segment) return null

  try {
    return decodeURIComponent(segment)
  } catch {
    return segment
  }
}

export function extractDiaryImageName(value: string | null): string | null {
  if (!value) return null
  const trimmed = value.trim()
  if (!trimmed) return null

  try {
    const url = new URL(trimmed)
    if (!url.pathname.includes(PUBLIC_BUCKET_PATH)) return null
    return lastPathSegment(url.pathname)
  } catch {
    return lastPathSegment(trimmed)
  }
}

export function collectReferencedDiaryImageNames(
  rows: readonly DiaryImageColumns[],
): Set<string> {
  const names = new Set<string>()

  for (const row of rows) {
    for (const value of [row.image_url_916, row.image_url_45, row.image_url_11]) {
      const name = extractDiaryImageName(value)
      if (name) names.add(name)
    }
  }

  return names
}

export function findOrphanDiaryImageNames(
  storedNames: readonly string[],
  referencedNames: ReadonlySet<string>,
): string[] {
  return storedNames
    .filter((name) => name && !name.startsWith('.') && !referencedNames.has(name))
    .sort((a, b) => a.localeCompare(b))
}
