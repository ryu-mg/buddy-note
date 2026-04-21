import Link from 'next/link'
import { redirect } from 'next/navigation'
import { ChevronLeft, ChevronRight } from 'lucide-react'

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
  const personalityLabel =
    pet.personality_code && pet.personality_label
      ? `${pet.personality_code} · ${pet.personality_label}`
      : '성격 미정'
  const detailLabel = [pet.breed, personalityLabel].filter(Boolean).join(' · ')

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md flex-col bg-[var(--color-bg)] pb-24">
      <header className="relative flex min-h-16 items-center justify-center border-b border-[var(--color-line)] px-4">
        <Link
          href="/"
          aria-label="홈으로 돌아가기"
          className="absolute left-2 grid size-11 place-items-center rounded-full text-[26px] leading-none text-[var(--color-ink-soft)] transition-colors hover:text-[var(--color-accent-brand)]"
        >
          <ChevronLeft aria-hidden className="size-6" strokeWidth={1.8} />
        </Link>
        <h1 className="text-[18px] font-semibold text-[var(--color-ink)]">
          내 정보
        </h1>
      </header>

      {photoFailed ? (
        <p
          role="status"
          className="mx-4 mt-4 rounded-[var(--radius-input)] bg-[var(--color-accent-brand-soft)] px-3 py-2 text-[13px] text-[var(--color-error)]"
        >
          프로필은 저장됐지만 대표 사진 저장만 실패했어요. 나중에 다시 설정해주세요.
        </p>
      ) : null}

      <section aria-label="버디 프로필" className="px-4 py-6">
        <div className="flex items-center gap-4">
          <ProfileAvatar src={photoUrl} name={pet.name} />
          <div className="min-w-0 flex-1">
            <h2 className="truncate text-[20px] font-semibold leading-[1.25] text-[var(--color-ink)]">
              {pet.name}
            </h2>
            <p className="mt-1 font-mono text-[13px] text-[var(--color-mute)]">
              @{pet.slug}
            </p>
            <p className="mt-2 truncate text-[13px] leading-[1.45] text-[var(--color-ink-soft)]">
              {detailLabel}
            </p>
          </div>
        </div>
      </section>

      <nav aria-label="마이페이지 메뉴" className="border-t border-[var(--color-line)]">
        <MenuRow href="/pet/edit" label="버디 정보 수정" />
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

function ProfileAvatar({ src, name }: { src: string | null; name: string }) {
  return (
    <div className="grid size-[74px] shrink-0 place-items-center overflow-hidden rounded-full bg-white ring-1 ring-[var(--color-line)]">
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt={`${name} 대표 사진`} className="size-full object-cover" />
      ) : (
        <span aria-hidden className="relative block size-12">
          <span className="absolute left-1/2 top-0 block size-6 -translate-x-1/2 rounded-full bg-[var(--color-line)]" />
          <span className="absolute bottom-0 left-1/2 block h-7 w-11 -translate-x-1/2 rounded-t-full bg-[var(--color-line)]" />
        </span>
      )}
    </div>
  )
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
