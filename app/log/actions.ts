'use server'

import { randomUUID } from 'node:crypto'

import { SupabaseClient } from '@supabase/supabase-js'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

import { stripExifServer } from '@/lib/image/exif-strip-server'
import { renderAllFormats } from '@/lib/image/render-3-formats'
import { generateDiary } from '@/lib/llm/generate-diary'
import { LOG_TAG_VALUES, logTagSchema } from '@/lib/llm/schemas'
import { createLogger } from '@/lib/logger'
import { checkLimit, diaryRatelimit } from '@/lib/rate-limit'
import {
  getSignedPhotoUrl,
  uploadDiaryImage,
  uploadPhoto,
} from '@/lib/storage'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import type { LogTag, RecentCallback } from '@/types/database'

/**
 * Database 타입이 supabase-js 2.103 의 `GenericTable` 제약
 * (`Relationships: GenericRelationship[]`) 을 만족하지 않아 typed 모드에서
 * Insert 가 `never` 로 좁혀진다. `types/database.ts` 는 Supabase CLI 로
 * 재생성 예정이므로, 본 Server Action 안에서만 untyped SupabaseClient 로
 * 국소 cast 한다 (`lib/supabase/server.ts` 가 이미 untyped 라 패턴 일치).
 */
type UntypedSupabase = SupabaseClient

const log = createLogger('log:action')

/**
 * /log Server Action — architecture.md §4 happy path.
 *
 * 결과는 throw 대신 discriminated union으로 반환한다. UI는 `ok === false`면
 * `code`를 보고 사과+회복 copy를 sonner toast로 노출.
 *
 * photo_url 저장 정책: `photo_storage_path`만 DB에 저장. `photo_url`은 7일
 * 만료 signed URL **스냅샷**을 넣는다. satori 렌더가 URL을 바로 소비하기 때문.
 * 만료 후 리프레시는 읽기 경로에서 `getSignedPhotoUrl(path)`로 재발급.
 */

export type CreateLogSuccess = { ok: true; diaryId: string }
export type CreateLogFailure = {
  ok: false
  error: string
  code: 'auth' | 'pet' | 'upload' | 'llm' | 'render' | 'db' | 'rate_limit'
}
export type CreateLogResult = CreateLogSuccess | CreateLogFailure

/** 사진 파일 CHECK — 8MB 상한 (architecture.md §8 Security) */
const MAX_PHOTO_BYTES = 8 * 1024 * 1024
const ALLOWED_MIME = new Set([
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
])

/**
 * FormData 파싱 스키마. `photo`만 File instanceof로 별도 검증한다
 * (zod에서 File 인스턴스 검사는 런타임 환경이 갈려서 수동 체크가 안전).
 */
const InputSchema = z.object({
  petId: z.string().uuid(),
  tags: z.array(logTagSchema).max(8),
  memo: z.string().max(200),
})

function parseTags(raw: FormDataEntryValue | null): LogTag[] | null {
  if (typeof raw !== 'string' || raw.trim().length === 0) return []
  try {
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return null
    const result: LogTag[] = []
    for (const v of parsed) {
      if (typeof v !== 'string') return null
      if (!(LOG_TAG_VALUES as readonly string[]).includes(v)) return null
      result.push(v as LogTag)
    }
    return result
  } catch {
    return null
  }
}

export async function createLog(formData: FormData): Promise<CreateLogResult> {
  // 1) Auth
  const supabase = await createClient()
  if (!supabase) {
    return { ok: false, error: '로그인이 필요해요.', code: 'auth' }
  }
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return { ok: false, error: '로그인이 필요해요.', code: 'auth' }
  }

  // 1b) Rate limit — per-user 시간당 10 일기 (arch §8). auth 이후, 실제 일 시작
  //     전에 체크해서 업로드/LLM 호출 비용이 소진되지 않게 한다. Upstash env
  //     미설정인 dev 모드에서는 stub 이 항상 통과 (isStub=true → 로그 silent).
  const rl = await checkLimit(diaryRatelimit, user.id)
  if (!rl.allowed) {
    return {
      ok: false,
      error: '오늘 기록을 많이 남겨주셨어요. 한 시간 뒤에 다시 와주세요.',
      code: 'rate_limit',
    }
  }

  // 2) Parse FormData
  const photoEntry = formData.get('photo')
  if (!(photoEntry instanceof File) || photoEntry.size === 0) {
    return { ok: false, error: '사진 한 장을 먼저 올려주세요.', code: 'pet' }
  }
  if (photoEntry.size > MAX_PHOTO_BYTES) {
    return {
      ok: false,
      error: '사진이 너무 커요. 8MB 이하로 올려주세요.',
      code: 'pet',
    }
  }
  const mime = (photoEntry.type || '').toLowerCase()
  if (mime && !ALLOWED_MIME.has(mime)) {
    return {
      ok: false,
      error: '이 사진 형식은 아직 지원하지 않아요. JPG/PNG/WebP로 올려주세요.',
      code: 'pet',
    }
  }

  const tags = parseTags(formData.get('tags'))
  if (tags === null) {
    return { ok: false, error: '태그 정보를 다시 확인해주세요.', code: 'pet' }
  }

  const memoRaw = formData.get('memo')
  const memo = typeof memoRaw === 'string' ? memoRaw : ''

  const parsed = InputSchema.safeParse({
    petId: formData.get('petId'),
    tags,
    memo,
  })
  if (!parsed.success) {
    return { ok: false, error: '입력을 다시 확인해주세요.', code: 'pet' }
  }
  const { petId, tags: validTags, memo: validMemo } = parsed.data

  // 3) Verify pet ownership (SSR client — RLS enforced)
  const { data: pet, error: petError } = await supabase
    .from('pets')
    .select('id, name, persona_prompt_fragment')
    .eq('id', petId)
    .eq('user_id', user.id)
    .single()

  if (petError || !pet) {
    return { ok: false, error: '강아지 정보를 찾지 못했어요.', code: 'pet' }
  }
  if (!pet.persona_prompt_fragment) {
    return {
      ok: false,
      error: '성격 정보가 비어있어요. 다시 설정해주세요.',
      code: 'pet',
    }
  }

  // 4) EXIF strip (server-side sharp — second line of defense)
  const arrayBuffer = await photoEntry.arrayBuffer()
  let cleanBuffer: Buffer
  try {
    cleanBuffer = await stripExifServer(Buffer.from(arrayBuffer))
  } catch (err) {
    log.error('EXIF strip failed', { err })
    return {
      ok: false,
      error: '사진을 읽는 중에 문제가 생겼어요. 다른 사진으로 해볼까요?',
      code: 'upload',
    }
  }

  // 5) Admin client — logs/diaries insert는 service role 경로로 안전하게.
  //    (logs 자체는 owner만 쓸 수 있지만, pipeline 중간 cleanup을 위해 admin 사용)
  const adminTyped = createAdminClient()
  if (!adminTyped) {
    return {
      ok: false,
      error: '서버 설정이 완료되지 않았어요.',
      code: 'db',
    }
  }
  // Database 타입 제약 이슈 — 위 주석 참고. mutation 경로만 untyped 로 사용.
  const admin = adminTyped as unknown as UntypedSupabase

  // logs 행을 먼저 만들어서 logId를 확보한다 (photo path에 필요).
  const { data: logRow, error: logInsertError } = await admin
    .from('logs')
    .insert({
      pet_id: petId,
      photo_url: '',
      photo_storage_path: '',
      tags: validTags,
      memo: validMemo.length > 0 ? validMemo : null,
    })
    .select('id')
    .single()

  if (logInsertError || !logRow) {
    log.error('log insert failed', { err: logInsertError })
    return {
      ok: false,
      error: '기록을 저장하지 못했어요. 잠시 후 다시 시도해주세요.',
      code: 'db',
    }
  }
  const logId = logRow.id

  // 6) Upload photo to `photos` bucket.
  //    Node Buffer → 독립 ArrayBuffer slice 로 복사해서
  //    BlobPart 타입 제약 (ArrayBuffer only, SharedArrayBuffer 거부) 을 맞춘다.
  const cleanArrayBuffer = cleanBuffer.buffer.slice(
    cleanBuffer.byteOffset,
    cleanBuffer.byteOffset + cleanBuffer.byteLength,
  ) as ArrayBuffer
  const cleanBlob = new Blob([cleanArrayBuffer], { type: 'image/jpeg' })
  const uploadRes = await uploadPhoto({
    userId: user.id,
    logId,
    file: cleanBlob,
    ext: 'jpg',
  })
  if ('error' in uploadRes) {
    // cleanup — orphan 방지
    await admin.from('logs').delete().eq('id', logId)
    return { ok: false, error: uploadRes.error, code: 'upload' }
  }
  const storagePath = uploadRes.path

  // 7) Signed URL 스냅샷 — satori 렌더와 DB 저장에 동일값 사용
  const signedRes = await getSignedPhotoUrl(storagePath)
  if ('error' in signedRes) {
    await admin.from('logs').delete().eq('id', logId)
    return { ok: false, error: signedRes.error, code: 'upload' }
  }
  const signedPhotoUrl = signedRes.url

  // logs row에 storage_path + signed URL 스냅샷 업데이트
  const { error: updateLogError } = await admin
    .from('logs')
    .update({
      photo_url: signedPhotoUrl,
      photo_storage_path: storagePath,
    })
    .eq('id', logId)

  if (updateLogError) {
    log.error('log update failed', { err: updateLogError })
    // 경로/URL 업데이트 실패는 치명적 — 롤백
    await admin.from('logs').delete().eq('id', logId)
    return {
      ok: false,
      error: '사진 저장 중에 문제가 생겼어요.',
      code: 'db',
    }
  }

  // 8) pet_memory_summary의 recent_callbacks 로드 (optional — 없어도 정상)
  let recentCallbacks: RecentCallback[] = []
  try {
    const { data: memoryRow } = await admin
      .from('pet_memory_summary')
      .select('recent_callbacks')
      .eq('pet_id', petId)
      .maybeSingle()
    if (memoryRow && Array.isArray(memoryRow.recent_callbacks)) {
      recentCallbacks = memoryRow.recent_callbacks
    }
  } catch (err) {
    // 테이블/행이 아직 없을 수 있음 — 조용히 진행.
    log.warn('memory summary fetch skipped', { err })
  }

  // 9) LLM 일기 생성 — fallback 내장 (항상 ok=true)
  const diaryResult = await generateDiary({
    photoBase64: cleanBuffer.toString('base64'),
    photoMediaType: 'image/jpeg',
    petName: pet.name,
    personaFragment: pet.persona_prompt_fragment,
    memo: validMemo,
    recentCallbacks,
  })

  // 10) satori 3포맷 렌더 — 실패해도 이미지 없이 진행 (fallback diary with no
  //     share images is still valuable, per 작업 지시).
  let renderedImages: Awaited<ReturnType<typeof renderAllFormats>> | null = null
  try {
    renderedImages = await renderAllFormats({
      photoUrl: signedPhotoUrl,
      petName: pet.name,
      diaryTitle: diaryResult.data.title,
      diaryBody: diaryResult.data.body,
    })
  } catch (err) {
    log.warn('satori render failed — continuing without images', { err })
    renderedImages = null
  }

  // 11) 3포맷 업로드 (parallel). 개별 실패는 null로 흘린다.
  let imageUrl916: string | null = null
  let imageUrl45: string | null = null
  let imageUrl11: string | null = null

  if (renderedImages) {
    const base = randomUUID()
    const uploads = await Promise.all([
      uploadDiaryImage({
        filename: `${base}-916.png`,
        buffer: renderedImages['9:16'],
        contentType: 'image/png',
      }),
      uploadDiaryImage({
        filename: `${base}-45.png`,
        buffer: renderedImages['4:5'],
        contentType: 'image/png',
      }),
      uploadDiaryImage({
        filename: `${base}-11.png`,
        buffer: renderedImages['1:1'],
        contentType: 'image/png',
      }),
    ])
    if ('publicUrl' in uploads[0]) imageUrl916 = uploads[0].publicUrl
    if ('publicUrl' in uploads[1]) imageUrl45 = uploads[1].publicUrl
    if ('publicUrl' in uploads[2]) imageUrl11 = uploads[2].publicUrl
  }

  // 12) diaries insert (service role — RLS는 service만 INSERT 허용)
  const { data: diaryRow, error: diaryInsertError } = await admin
    .from('diaries')
    .insert({
      log_id: logId,
      pet_id: petId,
      title: diaryResult.data.title,
      body: diaryResult.data.body,
      image_url_916: imageUrl916,
      image_url_45: imageUrl45,
      image_url_11: imageUrl11,
      is_fallback: diaryResult.meta.isFallback,
      model_used: diaryResult.meta.modelUsed,
      latency_ms: diaryResult.meta.latencyMs,
      tokens_input: diaryResult.meta.tokensInput,
      tokens_output: diaryResult.meta.tokensOutput,
    })
    .select('id')
    .single()

  if (diaryInsertError || !diaryRow) {
    log.error('diary insert failed', { err: diaryInsertError })
    // v1 cleanup 정책: log + photo는 남겨둔다 (재시도 여지 있음, orphan 수동 청소).
    return {
      ok: false,
      error: '일기를 저장하지 못했어요. 잠시 후 다시 시도해주세요.',
      code: 'db',
    }
  }

  // 13) 홈 타임라인 갱신
  revalidatePath('/')

  return { ok: true, diaryId: diaryRow.id }
}
