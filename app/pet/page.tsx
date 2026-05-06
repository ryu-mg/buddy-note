import Link from 'next/link'
import { redirect } from 'next/navigation'
import { ChevronRight } from 'lucide-react'

import { PassportCard } from '@/components/pet/passport-card'
import { getSignedPhotoUrl } from '@/lib/storage'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

type PetOverview = {
  id: string
  name: string
  breed: string | null
  slug: string
  is_public: boolean
  companion_relationship: string | null
  guardian_relationship: string | null
  profile_photo_storage_path: string | null
  personality_code: string | null
  personality_label: string | null
  created_at: string
}

type PageProps = {
  searchParams?: Promise<{ photo?: string }>
}

export default async function PetOverviewPage({ searchParams }: PageProps) {
  const supabase = await createClient()
  if (!supabase) redirect('/auth/login')

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: pet } = await supabase
    .from('pets')
    .select(
      [
        'id',
        'name',
        'breed',
        'slug',
        'is_public',
        'companion_relationship',
        'guardian_relationship',
        'profile_photo_storage_path',
        'personality_code',
        'personality_label',
        'created_at',
      ].join(', '),
    )
    .eq('user_id', user.id)
    .limit(1)
    .maybeSingle<PetOverview>()

  if (!pet) redirect('/onboarding')

  const resolvedSearchParams = searchParams ? await searchParams : {}
  const photoFailed = resolvedSearchParams.photo === 'failed'
  const photoUrl = pet.profile_photo_storage_path
    ? await getSignedProfilePhotoUrl(pet.profile_photo_storage_path)
    : null
  const daysSinceCreated = daysSince(pet.created_at)

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md flex-col bg-[var(--color-bg)] pb-24">
      {photoFailed ? (
        <p
          role="status"
          className="mx-4 mt-4 rounded-[var(--radius-input)] bg-[var(--color-accent-brand-soft)] px-3 py-2 text-[13px] text-[var(--color-error)]"
        >
          프로필은 저장됐지만 대표 사진 저장만 실패했어요. 나중에 다시 설정해주세요.
        </p>
      ) : null}

      <section aria-label="버디 프로필" className="px-4 py-8">
        <PassportCard
          name={pet.name}
          slug={pet.slug}
          personalityCode={pet.personality_code}
          personalityLabel={pet.personality_label}
          daysSinceCreated={daysSinceCreated}
          avatarUrl={photoUrl}
          isPublic={pet.is_public}
        />
      </section>

      <nav aria-label="마이페이지 메뉴" className="border-t border-[var(--color-line)]">
        <MenuRow href="/pet/edit" label="버디 정보 수정" />
        <MenuRow href="/pet/theme" label="앨범 테마 설정" />
        <MenuRow href="/pet/edit#personality" label="성격 다시 답하기" />
        <MenuRow
          href="/pet/edit#public"
          label="공개 프로필 설정"
          value={pet.is_public ? '공개중' : '비공개'}
        />
        <MenuRow href="/pet/edit#companion" label="반려인 호칭 수정" />
        <MenuRow href="/pet/delete" label="계정 탈퇴" tone="danger" />
      </nav>
    </main>
  )
}

async function getSignedProfilePhotoUrl(path: string): Promise<string | null> {
  const result = await getSignedPhotoUrl(path)
  return 'url' in result ? result.url : null
}

function daysSince(iso: string): number {
  const start = new Date(iso).getTime()
  if (Number.isNaN(start)) return 1
  const diff = Date.now() - start
  return Math.max(1, Math.floor(diff / 86_400_000) + 1)
}

function MenuRow({
  href,
  label,
  value,
  tone = 'default',
}: {
  href: string
  label: string
  value?: string
  tone?: 'default' | 'danger'
}) {
  return (
    <Link
      href={href}
      className="flex min-h-[54px] items-center gap-3 border-b border-[var(--color-line)] px-4 text-[16px] transition-colors hover:bg-[var(--color-paper)]"
    >
      <span
        className={
          tone === 'danger'
            ? 'min-w-0 flex-1 text-[var(--color-error)]'
            : 'min-w-0 flex-1 text-[var(--color-ink-soft)]'
        }
      >
        {label}
      </span>
      {value ? (
        <span className="shrink-0 text-[12px] text-[var(--color-mute)]">
          {value}
        </span>
      ) : null}
      <ChevronRight
        aria-hidden
        className="size-5 shrink-0 text-[var(--color-accent-brand)]"
        strokeWidth={1.8}
      />
    </Link>
  )
}
