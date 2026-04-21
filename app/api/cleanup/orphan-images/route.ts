import { NextResponse, type NextRequest } from 'next/server'

import {
  collectReferencedDiaryImageNames,
  DIARY_IMAGES_BUCKET,
  findOrphanDiaryImageNames,
} from '@/lib/ops/diary-image-cleanup'
import { hasValidBearerToken } from '@/lib/ops/cron-auth'
import { createAdminClient } from '@/lib/supabase/admin'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const LIST_LIMIT = 1000
const REMOVE_CHUNK_SIZE = 100

function getCleanupSecret(): string {
  return process.env.DIARY_IMAGE_CLEANUP_SECRET || process.env.CRON_SECRET || ''
}

function chunk<T>(values: readonly T[], size: number): T[][] {
  const chunks: T[][] = []
  for (let index = 0; index < values.length; index += size) {
    chunks.push(values.slice(index, index + size))
  }
  return chunks
}

async function listDiaryImageNames(): Promise<
  | { names: string[] }
  | { error: string; detail?: string }
> {
  const admin = createAdminClient()
  if (!admin) return { error: 'Supabase 설정이 필요해요.' }

  const names: string[] = []
  let offset = 0

  while (true) {
    const { data, error } = await admin.storage
      .from(DIARY_IMAGES_BUCKET)
      .list('', {
        limit: LIST_LIMIT,
        offset,
        sortBy: { column: 'name', order: 'asc' },
      })

    if (error) {
      return {
        error: 'diary-images bucket을 읽지 못했어요.',
        detail: error.message,
      }
    }

    const page = data ?? []
    names.push(...page.map((object) => object.name).filter(Boolean))

    if (page.length < LIST_LIMIT) break
    offset += LIST_LIMIT
  }

  return { names }
}

async function handleCleanup(request: NextRequest) {
  if (!hasValidBearerToken(request.headers, getCleanupSecret())) {
    return NextResponse.json(
      { ok: false, error: 'cleanup secret이 필요해요.' },
      { status: 401 },
    )
  }

  const admin = createAdminClient()
  if (!admin) {
    return NextResponse.json(
      { ok: false, error: 'Supabase 설정이 필요해요.' },
      { status: 503 },
    )
  }

  const url = new URL(request.url)
  const dryRun = url.searchParams.get('dryRun') === '1'

  const { data: diaries, error: diaryError } = await admin
    .from('diaries')
    .select('image_url_916,image_url_45,image_url_11')

  if (diaryError) {
    return NextResponse.json(
      {
        ok: false,
        error: 'diary image 참조 목록을 읽지 못했어요.',
        detail: diaryError.message,
      },
      { status: 500 },
    )
  }

  const listed = await listDiaryImageNames()
  if ('error' in listed) {
    return NextResponse.json({ ok: false, ...listed }, { status: 500 })
  }

  const referencedNames = collectReferencedDiaryImageNames(diaries ?? [])
  const orphanedNames = findOrphanDiaryImageNames(listed.names, referencedNames)
  const removedNames: string[] = []

  if (!dryRun && orphanedNames.length > 0) {
    for (const batch of chunk(orphanedNames, REMOVE_CHUNK_SIZE)) {
      const { data, error } = await admin.storage
        .from(DIARY_IMAGES_BUCKET)
        .remove(batch)

      if (error) {
        return NextResponse.json(
          {
            ok: false,
            error: 'orphan diary image를 삭제하지 못했어요.',
            detail: error.message,
            removed: removedNames.length,
          },
          { status: 500 },
        )
      }

      removedNames.push(...(data ?? []).map((object) => object.name).filter(Boolean))
    }
  }

  return NextResponse.json({
    ok: true,
    dryRun,
    scanned: listed.names.length,
    referenced: referencedNames.size,
    orphaned: orphanedNames.length,
    removed: removedNames.length,
  })
}

export async function GET(request: NextRequest) {
  return handleCleanup(request)
}

export async function POST(request: NextRequest) {
  return handleCleanup(request)
}
