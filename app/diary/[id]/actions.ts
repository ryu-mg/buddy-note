'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'

import { createLogger } from '@/lib/logger'
import { deletePhoto } from '@/lib/storage'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'

const log = createLogger('diary:action')

export type DeleteDiaryResult =
  | { ok: true }
  | { ok: false; error: string; code?: 'auth' | 'not_found' | 'db' }

const DiaryIdSchema = z.string().uuid('잘못된 요청이에요.')

/**
 * Extract Supabase Storage object name from a `diary-images` public URL.
 *
 * Public URL 형태: `https://<ref>.supabase.co/storage/v1/object/public/diary-images/<name>`
 * - path 뒤 `/diary-images/` 이후 segment가 object name.
 * - 다른 bucket / 잘못된 URL 이면 null 반환 (안전 guard — 엉뚱한 bucket 객체 삭제 방지).
 */
function extractDiaryImageName(url: string | null): string | null {
  if (!url) return null
  try {
    const parsed = new URL(url)
    const marker = '/diary-images/'
    const idx = parsed.pathname.indexOf(marker)
    if (idx === -1) return null
    const name = parsed.pathname.slice(idx + marker.length)
    if (!name) return null
    // 방어: 경로 탈출 금지 (..)
    if (name.includes('..')) return null
    return name
  } catch {
    return null
  }
}

/**
 * 일기 삭제. 소유권 확인 후 storage + DB cleanup.
 *
 * 순서:
 *  1) 소유권 확인 (diary → log → pet.user_id === user.id)
 *  2) photos bucket — log.photo_storage_path 제거 (best-effort)
 *  3) diary-images bucket — image_url_{916,45,11} 파일 제거 (best-effort)
 *  4) diaries row delete (service role)
 *  5) logs row delete (service role)
 *  6) revalidate 홈 / diary 상세 / 공개 프로필
 *
 * memory_update_queue 는 건드리지 않음 — pet 단위 집계라 이 log 하나 빠져도
 * 다른 row 처리에 영향 없음. 이미 처리된 요약은 rollback하지 않는다 (v1 정책).
 */
export async function deleteDiary(diaryId: string): Promise<DeleteDiaryResult> {
  const parsed = DiaryIdSchema.safeParse(diaryId)
  if (!parsed.success) {
    return { ok: false, error: '잘못된 요청이에요.', code: 'not_found' }
  }

  const supabase = await createClient()
  if (!supabase) {
    return { ok: false, error: 'Supabase 설정이 필요해요. 관리자에게 문의해주세요.', code: 'db' }
  }

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return { ok: false, error: '로그인이 필요해요.', code: 'auth' }
  }

  // 1) 소유권 + 삭제에 필요한 참조 한 번에 가져오기
  const { data: diary, error: fetchError } = await supabase
    .from('diaries')
    .select(
      'id, log_id, image_url_916, image_url_45, image_url_11, pet:pets(id, slug, user_id)',
    )
    .eq('id', parsed.data)
    .maybeSingle<{
      id: string
      log_id: string
      image_url_916: string | null
      image_url_45: string | null
      image_url_11: string | null
      pet: { id: string; slug: string; user_id: string } | null
    }>()

  if (fetchError || !diary || !diary.pet || diary.pet.user_id !== user.id) {
    // 정확한 이유 흘리지 않음 — 존재/권한 구분 없이 not_found
    return { ok: false, error: '기록을 찾지 못했어요.', code: 'not_found' }
  }

  const admin = createAdminClient()
  if (!admin) {
    return { ok: false, error: 'Supabase 설정이 필요해요. 관리자에게 문의해주세요.', code: 'db' }
  }

  // 2) photos bucket — log의 원본 사진 제거 (best-effort)
  const { data: logRow } = await supabase
    .from('logs')
    .select('photo_storage_path')
    .eq('id', diary.log_id)
    .maybeSingle<{ photo_storage_path: string | null }>()

  if (logRow?.photo_storage_path) {
    const result = await deletePhoto(logRow.photo_storage_path)
    if (result.error) {
      log.warn('photos bucket 삭제 실패 — DB 삭제는 진행', {
        err: result.error,
      })
    }
  }

  // 3) diary-images bucket — 3포맷 PNG 제거 (best-effort)
  const diaryImageNames = [
    extractDiaryImageName(diary.image_url_916),
    extractDiaryImageName(diary.image_url_45),
    extractDiaryImageName(diary.image_url_11),
  ].filter((name): name is string => name !== null)

  if (diaryImageNames.length > 0) {
    const { error: removeError } = await admin.storage
      .from('diary-images')
      .remove(diaryImageNames)
    if (removeError) {
      log.warn('diary-images 삭제 실패 — DB 삭제는 진행', { err: removeError })
    }
  }

  // 4) diaries row delete (admin — RLS 우회해서 확실히)
  const { error: diaryDeleteError } = await admin
    .from('diaries')
    .delete()
    .eq('id', diary.id)
  if (diaryDeleteError) {
    log.error('diaries delete 실패', { err: diaryDeleteError })
    return {
      ok: false,
      error: '기록을 지우는 중에 문제가 생겼어요. 잠시 후 다시 시도해주세요.',
      code: 'db',
    }
  }

  // 5) logs row delete (admin — FK cascade 아닐 수 있음, 명시적)
  const { error: logDeleteError } = await admin
    .from('logs')
    .delete()
    .eq('id', diary.log_id)
  if (logDeleteError) {
    // diary 는 이미 지워졌음. log 삭제 실패는 치명적이지 않음 — 로그만.
    log.warn('logs delete 실패 (diary는 이미 삭제됨)', { err: logDeleteError })
  }

  // 6) cache 무효화 — 홈, 상세, 공개 프로필
  try {
    revalidatePath('/')
    revalidatePath(`/diary/${diary.id}`)
    revalidatePath(`/b/${diary.pet.slug}`)
  } catch {
    // revalidate 실패는 critical 아님
  }

  return { ok: true }
}
