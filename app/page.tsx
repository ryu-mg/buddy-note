import Link from 'next/link'
import { redirect } from 'next/navigation'

import { createClient } from '@/lib/supabase/server'
import { getSignedPhotoUrl } from '@/lib/storage'
import { DiaryCard } from '@/components/home/diary-card'
import { PublicToggle } from '@/components/home/public-toggle'
import { Toaster } from '@/components/ui/sonner'

export const dynamic = 'force-dynamic'

type PetSummary = {
  id: string
  name: string
  slug: string
  is_public: boolean
  created_at: string
}

type DiaryFeedRow = {
  id: string
  title: string
  body: string
  image_url_45: string | null
  image_url_11: string | null
  created_at: string
  log: {
    photo_url: string | null
    photo_storage_path: string | null
  } | null
}

type DiaryCardData = {
  id: string
  title: string
  body: string
  imageUrl: string | null
  createdAt: string
}

function daysSince(iso: string): number {
  const start = new Date(iso).getTime()
  if (Number.isNaN(start)) return 1
  const diff = Date.now() - start
  return Math.max(1, Math.floor(diff / 86_400_000) + 1)
}

function formatDateRange(diaries: DiaryFeedRow[]): string | null {
  if (diaries.length === 0) return null
  const sorted = [...diaries].sort(
    (a, b) =>
      new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
  )
  const first = sorted[0]
  const last = sorted[sorted.length - 1]
  if (!first || !last) return null

  const fmt = (iso: string) => {
    const d = new Date(iso)
    if (Number.isNaN(d.getTime())) return ''
    return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(
      d.getDate(),
    ).padStart(2, '0')}`
  }

  const a = fmt(first.created_at)
  const b = fmt(last.created_at)
  if (!a || !b) return null
  if (a === b) return a
  return `${a} – ${b}`
}

export default async function Home() {
  const supabase = await createClient()

  // Env 미설정 — 기존 graceful fallback 보존.
  if (!supabase) {
    return (
      <main className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center gap-3 px-6 text-center">
        <h1 className="text-[22px] font-semibold text-[var(--color-ink)]">
          buddy-note
        </h1>
        <p className="text-[14px] leading-[1.6] text-[var(--color-ink-soft)]">
          Supabase 환경 설정이 필요해요. <code>.env.local</code>에
          <br />
          <code>NEXT_PUBLIC_SUPABASE_URL</code>과
          <code>NEXT_PUBLIC_SUPABASE_ANON_KEY</code>를
          <br />
          채워주시면 시작할 수 있어요.
        </p>
      </main>
    )
  }

  const {
    data: { user },
  } = await supabase.auth.getUser()

  // 익명 방문자 — landing.
  if (!user) {
    return <AnonymousLanding />
  }

  // pet 존재 여부 확인.
  const { data: pet } = await supabase
    .from('pets')
    .select('id, name, slug, is_public, created_at')
    .eq('user_id', user.id)
    .limit(1)
    .maybeSingle<PetSummary>()

  if (!pet) {
    redirect('/onboarding')
  }

  // diary feed.
  const { data: diariesRaw } = await supabase
    .from('diaries')
    .select(
      'id, title, body, image_url_45, image_url_11, created_at, log:logs(photo_url, photo_storage_path)',
    )
    .eq('pet_id', pet.id)
    .order('created_at', { ascending: false })
    .limit(20)
    .returns<DiaryFeedRow[]>()

  const diaries: DiaryFeedRow[] = diariesRaw ?? []

  // signed URL 일괄 재발급 — log.photo_storage_path 기준, Promise.all 로 병렬.
  const cards: DiaryCardData[] = await Promise.all(
    diaries.map(async (d): Promise<DiaryCardData> => {
      // 우선순위: 신선한 signed URL > 저장된 satori 4:5 > 저장된 satori 1:1 > 저장된 photo_url
      let imageUrl: string | null =
        d.image_url_45 ?? d.image_url_11 ?? d.log?.photo_url ?? null

      const path = d.log?.photo_storage_path
      if (path) {
        const signed = await getSignedPhotoUrl(path)
        if ('url' in signed) {
          imageUrl = signed.url
        }
      }

      return {
        id: d.id,
        title: d.title,
        body: d.body,
        imageUrl,
        createdAt: d.created_at,
      }
    }),
  )

  const dayN = daysSince(pet.created_at)
  const dateRange = formatDateRange(diaries)
  const subline = dateRange
    ? `${dateRange} · 기록 ${diaries.length}개`
    : '아직 기록이 없어요. 첫 일기를 함께 시작해볼까요?'

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-5xl flex-col gap-8 px-4 pb-20 pt-8 sm:px-6 md:gap-10 md:pt-10">
      <header className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div className="flex flex-col gap-1">
          <h1 className="text-[22px] font-semibold leading-[1.25] text-[var(--color-ink)] md:text-[24px]">
            {pet.name}의 이야기 {dayN}일째
          </h1>
          <p className="text-[13px] leading-[1.5] text-[var(--color-mute)]">
            {subline}
          </p>
        </div>
        <PublicToggle
          petId={pet.id}
          initialPublic={pet.is_public}
          slug={pet.slug}
        />
      </header>

      <Link
        href="/log"
        className="group/cta relative mx-auto block w-full max-w-[520px] motion-safe:transition-transform motion-safe:duration-200 motion-safe:ease-[var(--ease-soft-out)] motion-safe:[transform:rotate(-1.2deg)] motion-safe:hover:[transform:rotate(0deg)_translateY(-2px)] motion-reduce:rotate-0"
      >
        <div className="bg-[var(--color-paper)] px-7 py-7 shadow-[0_1px_2px_rgba(0,0,0,0.04),0_14px_32px_-18px_rgba(0,0,0,0.18)] ring-1 ring-[var(--color-line)]">
          <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-[var(--color-mute)]">
            오늘의 기록
          </p>
          <p
            className="mt-2 text-[20px] leading-[1.4] text-[var(--color-ink)]"
            style={{ fontFamily: 'var(--font-serif)' }}
          >
            오늘 {pet.name} 어땠어요?
          </p>
          <p className="mt-1.5 text-[13px] text-[var(--color-ink-soft)]">
            사진 한 장이면 일기로 만들어볼게요.
          </p>
          <div className="mt-5 inline-flex items-center gap-2 rounded-[10px] bg-[var(--color-accent-brand)] px-4 py-2.5 text-[14px] font-semibold text-white">
            일기 쓰러 가기
          </div>
        </div>
      </Link>

      {cards.length === 0 ? (
        <EmptyState petName={pet.name} />
      ) : (
        <section
          aria-label="일기 피드"
          className="grid grid-cols-1 gap-8 sm:gap-10 md:grid-cols-2"
        >
          {cards.map((card, idx) => (
            <DiaryCard
              key={card.id}
              id={card.id}
              title={card.title}
              body={card.body}
              imageUrl={card.imageUrl}
              createdAt={card.createdAt}
              tilt={idx % 2 === 0 ? 'left' : 'right'}
            />
          ))}
        </section>
      )}

      <Toaster />
    </main>
  )
}

function AnonymousLanding() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md flex-col items-center justify-center gap-7 px-6 py-12 text-center">
      <div className="flex flex-col gap-3">
        <p className="text-[12px] font-medium uppercase tracking-[0.18em] text-[var(--color-mute)]">
          buddy-note
        </p>
        <h1
          className="text-[28px] font-bold leading-[1.25] text-[var(--color-ink)]"
        >
          내 강아지의 성격을
          <br />
          1년 동안 기억해줄게요.
        </h1>
        <p className="mt-1 text-[15px] leading-[1.65] text-[var(--color-ink-soft)]">
          사진 한 장으로 일기가 되고, 일기가 쌓이면
          <br />
          우리 아이가 점점 더 자기 자신 같아져요.
        </p>
      </div>

      <div className="flex flex-col items-center gap-3">
        <Link
          href="/auth/login"
          className="rounded-[10px] bg-[var(--color-accent-brand)] px-6 py-3 text-[15px] font-semibold text-white transition-opacity duration-200 hover:opacity-90"
        >
          시작하기
        </Link>
        <p className="text-[12px] text-[var(--color-mute)]">
          이메일만 있으면 바로 시작할 수 있어요.
        </p>
      </div>
    </main>
  )
}

function EmptyState({ petName }: { petName: string }) {
  return (
    <section
      aria-label="첫 일기 안내"
      className="flex flex-col items-center justify-center px-2 py-6"
    >
      <div className="motion-safe:[transform:rotate(0.8deg)] motion-reduce:rotate-0">
        <div className="bg-[var(--color-paper)] px-7 pb-10 pt-7 shadow-[0_1px_2px_rgba(0,0,0,0.04),0_14px_32px_-18px_rgba(0,0,0,0.18)] ring-1 ring-[var(--color-line)] sm:px-10">
          <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-[var(--color-mute)]">
            첫 페이지
          </p>
          <p
            className="mt-3 text-[22px] leading-[1.4] text-[var(--color-ink)]"
            style={{ fontFamily: 'var(--font-serif)' }}
          >
            오늘 {petName} 어땠어요?
          </p>
          <p className="mt-2 text-[14px] leading-[1.6] text-[var(--color-ink-soft)]">
            사진 한 장이면 첫 일기가 시작돼요.
          </p>
          <div className="mt-6">
            <Link
              href="/log"
              className="inline-flex items-center justify-center rounded-[10px] bg-[var(--color-accent-brand)] px-5 py-2.5 text-[14px] font-semibold text-white transition-opacity duration-200 hover:opacity-90"
            >
              첫 일기 써보기
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}
