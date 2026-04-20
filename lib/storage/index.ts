import 'server-only'

import { createLogger } from '@/lib/logger'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient as createServerSupabase } from '@/lib/supabase/server'

const log = createLogger('storage')

/**
 * Supabase Storage buckets.
 * See AGENTS.md "Supabase Storage buckets" + rules/architecture.md §4.
 */
const PHOTOS_BUCKET = 'photos'
const DIARY_IMAGES_BUCKET = 'diary-images'

/** 7일 — architecture.md §7 caching table */
const DEFAULT_SIGNED_URL_TTL_SECONDS = 60 * 60 * 24 * 7

type UploadPhotoArgs = {
  userId: string
  logId: string
  file: File | Blob
  ext: string
}

/**
 * Upload a pet photo into the private `photos` bucket.
 *
 * Path convention: `photos/{userId}/{logId}.{ext}` (AGENTS.md).
 *
 * Uses the service-role client to bypass Storage RLS. Auth MUST be verified
 * by the Server Action calling this function — this helper trusts its inputs.
 */
export async function uploadPhoto(
  args: UploadPhotoArgs,
): Promise<{ path: string } | { error: string }> {
  const { userId, logId, file, ext } = args
  const admin = createAdminClient()
  if (!admin) return { error: 'Supabase 설정이 필요해요.' }

  const normalizedExt = ext.replace(/^\./, '').toLowerCase()
  if (!normalizedExt) return { error: '사진 확장자를 확인할 수 없어요.' }

  const path = `${userId}/${logId}.${normalizedExt}`

  const { error } = await admin.storage.from(PHOTOS_BUCKET).upload(path, file, {
    contentType: file.type || `image/${normalizedExt}`,
    upsert: false,
  })

  if (error) {
    log.error('uploadPhoto failed', { err: error })
    return { error: '사진을 올리는 중에 문제가 생겼어요.' }
  }

  return { path }
}

/**
 * Generate a short-lived signed URL for an object in the private photos bucket.
 * Uses the SSR server client (owner-scoped) — the photo must belong to the
 * current user (enforced by Storage RLS on the `photos` bucket).
 *
 * Default TTL: 7 days (architecture.md §7).
 */
export async function getSignedPhotoUrl(
  path: string,
  expiresInSeconds: number = DEFAULT_SIGNED_URL_TTL_SECONDS,
): Promise<{ url: string } | { error: string }> {
  const supabase = await createServerSupabase()
  if (!supabase) return { error: 'Supabase 설정이 필요해요.' }

  const { data, error } = await supabase.storage
    .from(PHOTOS_BUCKET)
    .createSignedUrl(path, expiresInSeconds)

  if (error || !data?.signedUrl) {
    log.error('getSignedPhotoUrl failed', { err: error })
    return { error: '사진 링크를 만들지 못했어요.' }
  }

  return { url: data.signedUrl }
}

type UploadDiaryImageArgs = {
  filename: string
  buffer: Buffer
  contentType: string
}

/**
 * Upload a rendered diary share image (satori output) to the public
 * `diary-images` bucket. Filenames should be UUIDs (caller responsibility).
 *
 * Returns the Supabase public URL — safe to store in `diaries.image_url_*`
 * and serve via CDN (architecture.md §7).
 */
export async function uploadDiaryImage(
  args: UploadDiaryImageArgs,
): Promise<{ publicUrl: string } | { error: string }> {
  const { filename, buffer, contentType } = args
  const admin = createAdminClient()
  if (!admin) return { error: 'Supabase 설정이 필요해요.' }

  const { error } = await admin.storage
    .from(DIARY_IMAGES_BUCKET)
    .upload(filename, buffer, {
      contentType,
      upsert: false,
    })

  if (error) {
    log.error('uploadDiaryImage failed', { err: error })
    return { error: '공유 이미지를 저장하지 못했어요.' }
  }

  const { data } = admin.storage.from(DIARY_IMAGES_BUCKET).getPublicUrl(filename)
  if (!data?.publicUrl) {
    return { error: '공유 이미지 URL을 만들지 못했어요.' }
  }

  return { publicUrl: data.publicUrl }
}

/**
 * Delete a photo by storage path. Admin cleanup helper — not part of the
 * happy path. Uses service role so ops can run it against any user's path.
 */
export async function deletePhoto(path: string): Promise<{ error?: string }> {
  const admin = createAdminClient()
  if (!admin) return { error: 'Supabase 설정이 필요해요.' }

  const { error } = await admin.storage.from(PHOTOS_BUCKET).remove([path])
  if (error) {
    log.error('deletePhoto failed', { err: error })
    return { error: '사진을 지우지 못했어요.' }
  }

  return {}
}
