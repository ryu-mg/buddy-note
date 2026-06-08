import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import type { CSSProperties } from 'react'

import { DeleteDiaryButton } from '@/components/diary/delete-diary-button'
import { DiaryDetailCard } from '@/components/diary/diary-detail-card'
import { RewriteDiaryButton } from '@/components/diary/rewrite-diary-button'
import { canRewriteDiary } from '@/lib/billing/entitlements'
import { getMembershipSnapshot } from '@/lib/billing/server'
import { resolveDiaryFontPreset } from '@/lib/diary-fonts/presets'
import { getPetDiaryFontKey } from '@/lib/diary-fonts/server'
import { createClient } from '@/lib/supabase/server'
import { getSignedPhotoUrl } from '@/lib/storage'

import { ShareModal } from './share-modal'

type PageProps = {
  params: Promise<{ id: string }>
  searchParams?: Promise<{ from?: string }>
}

// Diary + join된 pet 타입. select 문과 1:1 대응.
type DiaryWithPet = {
  id: string
  log_id: string
  pet_id: string
  title: string
  body: string
  image_url_916: string | null
  image_url_45: string | null
  image_url_11: string | null
  is_fallback: boolean
  created_at: string
  pet: {
    id: string
    name: string
    user_id: string
  } | null
}

type LogRef = {
  photo_url: string | null
  photo_storage_path: string | null
  log_date: string | null
  memo: string | null
  tags: string[] | null
}

function formatCompactDate(value: string): string {
  try {
    const [datePart] = value.split('T')
    const [year, month, day] = datePart.split('-')
    if (!year || !month || !day) return ''
    return `${year}.${month}.${day}`
  } catch {
    return ''
  }
}

export default async function DiaryPage({ params, searchParams }: PageProps) {
  // Next.js 16 — params는 Promise
  const { id } = await params

  const supabase = await createClient()
  if (!supabase) {
    return (
      <main className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center px-4 py-12 text-center">
        <p className="text-[15px] text-[var(--color-ink-soft)]">
          Supabase 설정이 필요해요. 잠시 후 다시 시도해주세요.
        </p>
      </main>
    )
  }

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    redirect('/auth/login')
  }

  const { data: diaryData, error: diaryError } = await supabase
    .from('diaries')
    .select(
      'id, log_id, pet_id, title, body, image_url_916, image_url_45, image_url_11, is_fallback, created_at, pet:pets(id, name, user_id)',
    )
    .eq('id', id)
    .single<DiaryWithPet>()

  if (diaryError || !diaryData) {
    notFound()
  }

  const diary = diaryData
  if (!diary.pet || diary.pet.user_id !== user.id) {
    notFound()
  }

  const membership = await getMembershipSnapshot(supabase, user.id)
  const canRewrite = canRewriteDiary(membership)
  const diaryFontKey = await getPetDiaryFontKey(supabase, diary.pet.id)
  const diaryFont = resolveDiaryFontPreset(diaryFontKey)

  // 사진은 매번 fresh signed URL로 다시 발급 — 오래된 photo_url 신뢰 X
  const { data: logData } = await supabase
    .from('logs')
    .select('photo_url, photo_storage_path, log_date, memo, tags')
    .eq('id', diary.log_id)
    .single<LogRef>()

  let photoUrl: string | null = logData?.photo_url ?? null
  if (logData?.photo_storage_path) {
    const signed = await getSignedPhotoUrl(logData.photo_storage_path)
    if ('url' in signed) {
      photoUrl = signed.url
    }
  }

  const dateLabel = formatCompactDate(
    logData?.log_date ?? diary.created_at.slice(0, 10),
  )
  const source = resolveDiarySource((await searchParams)?.from)
  const backTarget = source === 'week' ? '/week' : '/'
  const backLabel = source === 'week' ? '← 주간으로' : '← 홈으로'
  const rewriteReturnTo = `/diary/${diary.id}${source === 'week' ? '?from=week' : '?from=home'}`

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-xl flex-col gap-8 px-4 pb-16 pt-8">
      <header className="flex items-center justify-between">
        <Link
          href={backTarget}
          className="text-[13px] text-[var(--color-mute)] underline-offset-4 transition-opacity hover:opacity-70 hover:underline"
        >
          {backLabel}
        </Link>
        <span className="text-[12px] font-medium uppercase tracking-[0.14em] text-[var(--color-mute)]">
          diary
        </span>
      </header>

      {diary.is_fallback ? (
        <section
          role="status"
          aria-live="polite"
          className="rounded-[8px] border border-[var(--color-accent-brand-soft)] bg-[var(--color-accent-brand-soft)] px-4 py-3 text-[13px] leading-[1.6] text-[var(--color-ink-soft)]"
        >
          내가 오늘 말이 잘 안 떠올랐어. 잠깐 임시로 적어둘게.
        </section>
      ) : null}

      <DiaryDetailCard
        titleId="diary-title"
        title={diary.title}
        body={diary.body}
        dateLabel={dateLabel}
        petName={diary.pet.name}
        imageUrl={photoUrl}
        priority
        style={{ '--font-diary-writing': diaryFont.cssValue } as CSSProperties}
      />

      <section className="mx-auto flex w-full max-w-[420px] flex-col gap-3">
        <ShareModal
          diaryId={diary.id}
          title={diary.title}
          petName={diary.pet.name}
          images={{
            '9:16': diary.image_url_916,
            '4:5': diary.image_url_45,
            '1:1': diary.image_url_11,
          }}
        />

        <div className="flex justify-center">
          <RewriteDiaryButton
            diaryId={diary.id}
            canRewrite={canRewrite}
            returnTo={rewriteReturnTo}
            fullWidth
          />
        </div>

        {diary.is_fallback ? (
          <div className="mt-1 flex flex-col items-center gap-1.5">
            <button
              type="button"
              disabled
              title="곧 준비될게요"
              aria-disabled="true"
              className="rounded-[10px] border border-[var(--color-line)] px-4 py-2.5 text-[13px] font-medium text-[var(--color-mute)] opacity-60"
            >
              다시 해볼래
            </button>
            <p className="text-[12px] text-[var(--color-mute)]">
              이 기능은 곧 준비될게요.
            </p>
          </div>
        ) : null}

        <div className="mt-6 flex justify-center">
          <DeleteDiaryButton diaryId={diary.id} petName={diary.pet.name} />
        </div>
      </section>
    </main>
  )
}

function resolveDiarySource(source: string | undefined): 'home' | 'week' {
  return source === 'week' ? 'week' : 'home'
}
