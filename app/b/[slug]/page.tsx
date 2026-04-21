import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'

import { createClient } from '@/lib/supabase/server'

import { EmptyState } from '@/components/empty/empty-state'
import { ProfileHero } from '@/components/public/profile-hero'
import { PublicDiaryCard } from '@/components/public/public-diary-card'

type PageProps = {
  params: Promise<{ slug: string }>
}

// ISR: 24h.
// 카카오톡은 OG 메타를 24시간 공격적으로 캐시 (architecture.md §7).
// `revalidate = 86400`을 카카오 캐시 TTL과 맞춰 동일 페이지 OG가 분리/일관되게 노출.
// 새 일기 추가 시 LLM 파이프라인이 `revalidateTag('pet-{id}')` (Week 2)로 즉시 무효화.
export const revalidate = 86400

// SELECT 컬럼은 RLS-safe set만 (user_id, persona_*는 절대 노출 X).
type PublicPet = {
  id: string
  name: string
  slug: string
  is_public: boolean
  created_at: string
  personality_code: string | null
  personality_label: string | null
}

type PublicDiary = {
  id: string
  title: string
  body: string
  image_url_45: string | null
  image_url_11: string | null
  created_at: string
}

async function fetchPublicPet(slug: string): Promise<PublicPet | null> {
  const supabase = await createClient()
  if (!supabase) return null

  const { data } = await supabase
    .from('pets')
    .select('id, name, slug, is_public, created_at, personality_code, personality_label')
    .eq('slug', slug)
    .eq('is_public', true)
    .maybeSingle<PublicPet>()

  return data ?? null
}

async function fetchPublicDiaries(petId: string): Promise<PublicDiary[]> {
  const supabase = await createClient()
  if (!supabase) return []

  // 익명 클라이언트지만 RLS `diaries_select_public` 정책이 parent pet.is_public=true 일 때 통과.
  // user_id / log 정보 / persona는 select에서 제외 — PII leak 방지.
  const { data } = await supabase
    .from('diaries')
    .select('id, title, body, image_url_45, image_url_11, created_at')
    .eq('pet_id', petId)
    .order('created_at', { ascending: false })
    .limit(30)

  return (data as PublicDiary[] | null) ?? []
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug } = await params

  const pet = await fetchPublicPet(slug)
  if (!pet) {
    // 슬러그 존재/비공개 leak 방지: 일반화된 metadata만.
    return { title: 'buddy-note' }
  }

  const diaries = await fetchPublicDiaries(pet.id)
  const latest = diaries[0]

  const title = `${pet.name}의 이야기 | buddy-note`
  const description = latest?.title
    ? `${latest.title} — AI가 기록한 반려동물의 하루`
    : `${pet.name}의 일기 모음 — AI가 기록한 반려동물의 하루`

  // OG image 우선순위: 1:1 (Kakao/Instagram-friendly) → 4:5 (Instagram feed) → 없음.
  // 정사각이 KakaoTalk 인앱 미리보기에서 가장 안정적으로 보임.
  const ogImage = latest?.image_url_11 ?? latest?.image_url_45 ?? null
  const ogIsSquare = !!latest?.image_url_11

  const images = ogImage
    ? [
        {
          url: ogImage,
          width: ogIsSquare ? 1080 : 1080,
          height: ogIsSquare ? 1080 : 1350,
          alt: `${pet.name}의 일기`,
        },
      ]
    : undefined

  // `metadataBase` (app/layout.tsx) 가 상대 경로를 자동 절대화 — `/b/${slug}` 로 충분.
  const path = `/b/${slug}`

  return {
    title,
    description,
    alternates: {
      canonical: path,
    },
    openGraph: {
      title,
      description,
      type: 'profile',
      url: path,
      images,
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: ogImage ? [ogImage] : undefined,
    },
  }
}

function daysSince(iso: string): number {
  try {
    const start = new Date(iso).getTime()
    const now = Date.now()
    const diff = Math.floor((now - start) / (1000 * 60 * 60 * 24))
    return Math.max(1, diff + 1)
  } catch {
    return 1
  }
}

export default async function PublicProfilePage({ params }: PageProps) {
  const { slug } = await params

  const pet = await fetchPublicPet(slug)
  if (!pet) {
    // is_public=false 인 경우와 존재하지 않는 경우를 구분하지 않음 — 정보 leak 방지.
    notFound()
  }

  const diaries = await fetchPublicDiaries(pet.id)
  const days = daysSince(pet.created_at)

  return (
    <main className="public-profile-surface mx-auto flex min-h-screen w-full max-w-5xl flex-col gap-12 px-4 pb-16 pt-10 sm:px-6">
      <ProfileHero
        name={pet.name}
        days={days}
        diaryCount={diaries.length}
        personalityCode={pet.personality_code}
        personalityLabel={pet.personality_label}
        images={diaries.map((d) => d.image_url_45 ?? d.image_url_11)}
      />

      {/* Feed */}
      {diaries.length === 0 ? (
        <EmptyState
          title={`${pet.name} 아직 첫 일기를 준비 중이에요`}
          hint="다음에 다시 놀러 와주세요."
          tone="neutral"
          cta={null}
          illustration="resting"
        />
      ) : (
        <section
          aria-label={`${pet.name}의 일기 모음`}
          className="grid grid-cols-1 gap-12 md:grid-cols-2 md:gap-x-10 md:gap-y-16"
        >
          {diaries.map((d) => (
            <PublicDiaryCard
              key={d.id}
              title={d.title}
              body={d.body}
              imageUrl={d.image_url_45 ?? d.image_url_11}
              createdAt={d.created_at}
              petName={pet.name}
            />
          ))}
        </section>
      )}

      {/* Soft CTA — showcase, not hard sell */}
      <section className="mx-auto flex flex-col items-center gap-3 pt-4 text-center">
        <p className="text-[13px] text-[var(--color-mute)]">
          내 강아지의 이야기도 남겨볼래요?
        </p>
        <Link
          href="/auth/login"
          className="rounded-[10px] border border-[var(--color-line)] bg-[var(--color-bg)] px-5 py-2.5 text-[14px] font-medium text-[var(--color-ink)] transition-opacity hover:opacity-80"
        >
          나도 만들어보기
        </Link>
      </section>

      {/* Footer */}
      <footer className="flex justify-center pt-6">
        <Link
          href="/"
          className="text-[12px] uppercase tracking-[0.18em] text-[var(--color-mute)] underline-offset-4 hover:underline"
        >
          buddy-note
        </Link>
      </footer>
    </main>
  )
}
