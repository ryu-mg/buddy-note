'use server'

import { revalidatePath } from 'next/cache'

import { createLogger } from '@/lib/logger'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'

const log = createLogger('pet:delete')

export type DeleteAccountResult =
  | { ok: true }
  | {
      ok: false
      error: string
      code: 'auth' | 'name_mismatch' | 'db'
    }

const PHOTOS_BUCKET = 'photos'

/**
 * 계정 탈퇴 — 영구, 복구 불가.
 *
 * 순서 (FK 의존 역순 + 방어적 purge):
 *   1. diaries    (pet_id IN user pets)
 *   2. logs       (pet_id IN user pets)
 *   3. pet_memory_summary
 *   4. memory_update_queue
 *   5. Storage `photos/{user_id}/*` 전부 제거
 *   6. Storage `diary-images` orphan cleanup — 별도 cron 으로 미룸 (아래 TODO)
 *   7. pets      (user_id = user.id)
 *   8. auth user 삭제 (admin.auth.admin.deleteUser)
 *
 * 부분 실패 시: logger 로 기록 + 사용자에게 "일부가 남았어요" 안내.
 * 치명적 순서(pets 삭제 전에 diaries/logs/memory 가 이미 삭제됐는지)는
 * 가능하면 유지하지만, ON DELETE CASCADE 가 중복 안전망.
 *
 * 호출자는 성공 시 client 에서 /auth/login 으로 push.
 */
export async function deleteAccount(
  formData: FormData,
): Promise<DeleteAccountResult> {
  const confirmNameRaw = formData.get('confirmName')
  const confirmName =
    typeof confirmNameRaw === 'string' ? confirmNameRaw.trim() : ''

  // 1) Auth
  const supabase = await createClient()
  if (!supabase) {
    return { ok: false, error: 'Supabase 설정이 필요해요.', code: 'auth' }
  }
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return { ok: false, error: '로그인이 필요해요.', code: 'auth' }
  }

  // 2) pet 조회 (이름 매칭 근거). pet 이 여럿이면 전부 로드해서 이름 매칭.
  const { data: pets, error: petsError } = await supabase
    .from('pets')
    .select('id, name')
    .eq('user_id', user.id)
    .returns<{ id: string; name: string }[]>()

  if (petsError) {
    log.error('pets fetch failed', { err: petsError })
    return {
      ok: false,
      error: '프로필 정보를 불러오지 못했어요. 잠시 후 다시 시도해주세요.',
      code: 'db',
    }
  }

  if (!pets || pets.length === 0) {
    // pet 이 없는 상태 — auth user 만 삭제하면 됨.
    // 이름 확인은 건너뛸 수 없음: "탈퇴" 같은 고정 키워드로 fallback.
    if (confirmName !== '탈퇴') {
      return {
        ok: false,
        error: '"탈퇴" 라고 정확히 입력해주세요.',
        code: 'name_mismatch',
      }
    }
  } else {
    // pet 이 있으면 primary pet 이름과 일치해야 한다.
    const primary = pets[0]
    if (!primary || primary.name.trim() !== confirmName) {
      return {
        ok: false,
        error: '이름이 일치하지 않아요.',
        code: 'name_mismatch',
      }
    }
  }

  const admin = createAdminClient()
  if (!admin) {
    return {
      ok: false,
      error: '서버 설정이 완료되지 않았어요.',
      code: 'db',
    }
  }

  const petIds = (pets ?? []).map((p) => p.id)

  // 3) DB purge — 각 단계 실패는 치명적으로 취급 (partial delete 방지).
  if (petIds.length > 0) {
    // diaries
    {
      const { error } = await admin
        .from('diaries')
        .delete()
        .in('pet_id', petIds)
      if (error) {
        log.error('diaries delete failed', { err: error })
        return {
          ok: false,
          error:
            '삭제 중 일부가 남았어요. 잠시 후 다시 시도해주시거나 관리자에게 문의해주세요.',
          code: 'db',
        }
      }
    }
    // logs
    {
      const { error } = await admin.from('logs').delete().in('pet_id', petIds)
      if (error) {
        log.error('logs delete failed', { err: error })
        return {
          ok: false,
          error:
            '삭제 중 일부가 남았어요. 잠시 후 다시 시도해주시거나 관리자에게 문의해주세요.',
          code: 'db',
        }
      }
    }
    // pet_memory_summary
    {
      const { error } = await admin
        .from('pet_memory_summary')
        .delete()
        .in('pet_id', petIds)
      if (error) {
        log.error('pet_memory_summary delete failed', { err: error })
        return {
          ok: false,
          error:
            '삭제 중 일부가 남았어요. 잠시 후 다시 시도해주시거나 관리자에게 문의해주세요.',
          code: 'db',
        }
      }
    }
    // memory_update_queue
    {
      const { error } = await admin
        .from('memory_update_queue')
        .delete()
        .in('pet_id', petIds)
      if (error) {
        // queue 잔류는 치명적이지 않음 (pet 삭제 후 orphan FK 는 cron 에서
        // 정리 가능). 로깅만 하고 진행.
        log.warn('memory_update_queue delete soft-failed', { err: error })
      }
    }
  }

  // 4) Storage — photos/{user_id}/* 모두 제거 (best-effort).
  try {
    const { data: files, error: listError } = await admin.storage
      .from(PHOTOS_BUCKET)
      .list(user.id, { limit: 1000 })
    if (listError) {
      log.warn('photos list soft-failed', { err: listError })
    } else if (files && files.length > 0) {
      const paths = files.map((f) => `${user.id}/${f.name}`)
      const { error: removeError } = await admin.storage
        .from(PHOTOS_BUCKET)
        .remove(paths)
      if (removeError) {
        log.warn('photos remove soft-failed', { err: removeError })
      }
    }
  } catch (err) {
    log.warn('photos cleanup exception', { err })
  }

  // TODO: orphan diary-images cleanup.
  //   diary-images bucket 은 UUID 파일명이라 user 단위 prefix 가 없다.
  //   탈퇴 시 해당 유저의 diaries.image_url_{916,45,11} 을 파싱해서 각각
  //   remove 하는 로직은 비용-이익 트레이드오프 상 별도 orphan-cleanup cron
  //   (v1.5) 에서 처리한다. diaries row 가 먼저 삭제되었으므로 정책적으로
  //   접근이 불가능한 고아 파일이 됨 — 공개 URL 이지만 경로 UUID 가 공유되지
  //   않는 이상 회수 위험은 낮음.

  // 5) pets 삭제 (CASCADE 안전망 발동 가능).
  if (petIds.length > 0) {
    const { error: petsDeleteError } = await admin
      .from('pets')
      .delete()
      .eq('user_id', user.id)
    if (petsDeleteError) {
      log.error('pets delete failed', { err: petsDeleteError })
      return {
        ok: false,
        error:
          '삭제 중 일부가 남았어요. 잠시 후 다시 시도해주시거나 관리자에게 문의해주세요.',
        code: 'db',
      }
    }
  }

  // 6) auth user 삭제 — 실패하면 DB 만 남은 정합성 깨진 상태로 가진 않음
  //    (pets/logs/diaries 는 위에서 이미 제거됨). 다만 user 가 남아서 재로그인
  //    시 빈 계정이 될 수 있으니 사용자에게 고지.
  const { error: authDeleteError } = await admin.auth.admin.deleteUser(user.id)
  if (authDeleteError) {
    log.error('auth user delete failed', { err: authDeleteError })
    // 그래도 세션은 정리해둔다 (다음 로그인 시 다시 가입 흐름으로 탈 수 있게).
    try {
      await supabase.auth.signOut()
    } catch {
      /* noop */
    }
    return {
      ok: false,
      error:
        '계정 데이터는 지워졌지만 로그인 정보 삭제가 남았어요. 관리자에게 문의해주세요.',
      code: 'db',
    }
  }

  // 7) 세션 쿠키 정리.
  try {
    await supabase.auth.signOut()
  } catch {
    /* noop */
  }

  try {
    revalidatePath('/', 'layout')
  } catch {
    /* noop */
  }

  return { ok: true }
}
