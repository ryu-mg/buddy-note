import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'

import { createClient } from '@/lib/supabase/server'
import { getPetThemeKey } from '@/lib/themes/server'

import { EmptyState } from '@/components/empty/empty-state'
import { ProfileHero } from '@/components/public/profile-hero'
import { PublicDiaryCard } from '@/components/public/public-diary-card'
import { ThemeScope } from '@/components/themes/theme-scope'

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

/** 한국어 목적격 조사 — 받침 있으면 '을', 없으면 '를' */
function objectMarker(name: string): string {
  if (!name) return ''
  const code = name.charCodeAt(name.length - 1) - 0xac00
  if (code < 0 || code > 11171) return '을(를)' // 한글 외
  const hasJongseong = code % 28 !== 0
  return hasJongseong ? '을' : '를'
}

function ShareIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      <circle cx="18" cy="5" r="3" />
      <circle cx="6" cy="12" r="3" />
      <circle cx="18" cy="19" r="3" />
      <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
      <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
    </svg>
  )
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
  const supabase = await createClient()
  const themeKey = supabase ? await getPetThemeKey(supabase, pet.id) : null
  const days = daysSince(pet.created_at)

  const shareUrl =
    process.env.NEXT_PUBLIC_SITE_URL
      ? `${process.env.NEXT_PUBLIC_SITE_URL}/b/${slug}`
      : `/b/${slug}`

  const marker = objectMarker(pet.name)

  return (
    <ThemeScope
      as="main"
      themeKey={themeKey}
      className="public-profile-surface mx-auto flex min-h-screen w-full max-w-5xl flex-col gap-12 px-4 pb-16 pt-10 sm:px-6"
    >
      <ProfileHero
        name={pet.name}
        days={days}
        diaryCount={diaries.length}
        personalityCode={pet.personality_code}
        personalityLabel={pet.personality_label}
        images={diaries.map((d) => d.image_url_45 ?? d.image_url_11)}
      />

      {/* Feed — mosaic grid */}
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
          aria-label={`${pet.name} 폴라로이드`}
          className="grid grid-cols-1 gap-y-14 md:grid-cols-6 md:gap-x-8 md:gap-y-20"
        >
          {diaries.map((d, i) => {
            // 0-indexed: 2, 6, 10 → wide (col-span-6)
            const wide = i % 4 === 2
            // 기울임 변주 (wrapper에만, 모바일 제외)
            const tiltExtra =
              i % 5 === 1
                ? 'md:rotate-[1.5deg]'
                : i % 5 === 4
                  ? 'md:-rotate-[1deg]'
                  : ''
            return (
              <div
                key={d.id}
                className={[
                  'flex justify-center',
                  wide ? 'md:col-span-6' : 'md:col-span-3',
                  tiltExtra,
                ]
                  .filter(Boolean)
                  .join(' ')}
              >
                <PublicDiaryCard
                  title={d.title}
                  body={d.body}
                  imageUrl={d.image_url_45 ?? d.image_url_11}
                  createdAt={d.created_at}
                  petName={pet.name}
                  wide={wide}
                />
              </div>
            )
          })}
        </section>
      )}

      {/* 감정 footer chip */}
      <footer className="mt-20 flex flex-col items-center gap-3 border-t border-[var(--color-line)] pt-10 text-center">
        <p className="font-serif text-[20px] font-semibold text-[var(--color-ink-soft)]">
          {pet.name}{marker} 더 보고 싶다면
        </p>
        <a
          href={shareUrl}
          className="inline-flex items-center gap-2 rounded-[var(--radius-pill)] border border-[var(--color-line)] bg-[var(--theme-paper,var(--color-paper))] px-4 py-2 text-[13px] font-semibold text-[var(--color-ink)] transition-colors hover:border-[var(--theme-accent,var(--color-accent-brand))] hover:text-[var(--theme-accent,var(--color-accent-brand))]"
          aria-label={`${pet.name} 프로필 공유하기`}
        >
          <ShareIcon className="h-4 w-4" />
          공유하기
        </a>
        <p className="mt-2 text-[11px] text-[var(--color-mute)]">buddy-note에서 만들었어요</p>
      </footer>

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

      {/* Site footer */}
      <footer className="flex justify-center pt-6">
        <Link
          href="/"
          className="text-[12px] uppercase tracking-[0.18em] text-[var(--color-mute)] underline-offset-4 hover:underline"
        >
          buddy-note
        </Link>
      </footer>
    </ThemeScope>
  )
}
