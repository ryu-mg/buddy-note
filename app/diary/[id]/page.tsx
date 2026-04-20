import Image from 'next/image'
import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'

import { createClient } from '@/lib/supabase/server'
import { getSignedPhotoUrl } from '@/lib/storage'

import { ShareModal } from './share-modal'

type PageProps = {
  params: Promise<{ id: string }>
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
    slug: string
    is_public: boolean
  } | null
}

type LogRef = {
  photo_url: string | null
  photo_storage_path: string | null
  memo: string | null
  tags: string[] | null
}

function formatDate(iso: string): string {
  // "2026년 4월 20일" — 한국 로케일, 앱 UI 톤
  try {
    const d = new Date(iso)
    const y = d.getFullYear()
    const m = d.getMonth() + 1
    const day = d.getDate()
    return `${y}년 ${m}월 ${day}일`
  } catch {
    return ''
  }
}

export default async function DiaryPage({ params }: PageProps) {
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
      'id, log_id, pet_id, title, body, image_url_916, image_url_45, image_url_11, is_fallback, created_at, pet:pets(id, name, user_id, slug, is_public)',
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

  // 사진은 매번 fresh signed URL로 다시 발급 — 오래된 photo_url 신뢰 X
  const { data: logData } = await supabase
    .from('logs')
    .select('photo_url, photo_storage_path, memo, tags')
    .eq('id', diary.log_id)
    .single<LogRef>()

  let photoUrl: string | null = logData?.photo_url ?? null
  if (logData?.photo_storage_path) {
    const signed = await getSignedPhotoUrl(logData.photo_storage_path)
    if ('url' in signed) {
      photoUrl = signed.url
    }
  }

  const publicUrl = diary.pet.is_public
    ? `/b/${diary.pet.slug}`
    : null

  const dateLabel = formatDate(diary.created_at)

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-xl flex-col gap-8 px-4 pb-16 pt-8">
      <header className="flex items-center justify-between">
        <Link
          href="/"
          className="text-[13px] text-[var(--color-mute)] underline-offset-4 transition-opacity hover:opacity-70 hover:underline"
        >
          ← 홈으로
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
          AI가 잠시 놓쳤어요. 이건 임시 일기예요. 아래 &apos;다시 만들기&apos; 버튼으로 새로
          만들어볼 수 있어요.
        </section>
      ) : null}

      <article
        aria-labelledby="diary-title"
        className="relative mx-auto w-full max-w-[420px] bg-[var(--color-paper)] px-6 pb-11 pt-6 shadow-[0_1px_2px_rgba(0,0,0,0.04),0_14px_38px_-18px_rgba(0,0,0,0.18)] ring-1 ring-[var(--color-line)] motion-safe:-rotate-[1.2deg] motion-reduce:rotate-0"
      >
        <div className="flex items-baseline justify-between gap-3">
          <p className="text-[12px] font-medium uppercase tracking-[0.12em] text-[var(--color-mute)]">
            {dateLabel}
          </p>
          <p
            className="text-[14px] leading-[1.5] text-[var(--color-ink)]"
            style={{ fontFamily: 'var(--font-serif)' }}
          >
            {diary.pet.name}
          </p>
        </div>

        {photoUrl ? (
          <div className="mt-4 overflow-hidden bg-[var(--color-line)]">
            {/* DESIGN §8 — 사진은 1:1 square crop 기본. Diary 카드 내부는 4:5 ratio. */}
            <div className="relative aspect-[4/5] w-full">
              <Image
                src={photoUrl}
                alt={`${diary.pet.name}의 사진`}
                fill
                sizes="(max-width: 640px) 100vw, 420px"
                className="object-cover"
                priority
              />
            </div>
          </div>
        ) : (
          <div className="mt-4 flex aspect-[4/5] w-full items-center justify-center bg-[var(--color-line)] text-[13px] text-[var(--color-mute)]">
            사진을 불러오지 못했어요.
          </div>
        )}

        <h1
          id="diary-title"
          className="mt-6 text-[26px] font-semibold leading-[1.3] text-[var(--color-ink)]"
        >
          {diary.title}
        </h1>

        <p
          className="mt-4 whitespace-pre-wrap text-[18px] leading-[1.7] text-[var(--color-ink)]"
          style={{ fontFamily: 'var(--font-serif)' }}
        >
          {diary.body}
        </p>
      </article>

      <section className="mx-auto flex w-full max-w-[420px] flex-col gap-3">
        <ShareModal
          title={diary.title}
          petName={diary.pet.name}
          images={{
            '9:16': diary.image_url_916,
            '4:5': diary.image_url_45,
            '1:1': diary.image_url_11,
          }}
          publicUrl={publicUrl}
        />

        {diary.is_fallback ? (
          <div className="mt-1 flex flex-col items-center gap-1.5">
            <button
              type="button"
              disabled
              title="곧 준비될게요"
              aria-disabled="true"
              className="rounded-[10px] border border-[var(--color-line)] px-4 py-2.5 text-[13px] font-medium text-[var(--color-mute)] opacity-60"
            >
              다시 만들기
            </button>
            <p className="text-[12px] text-[var(--color-mute)]">
              이 기능은 곧 준비될게요.
            </p>
          </div>
        ) : null}
      </section>
    </main>
  )
}
