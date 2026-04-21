import Link from 'next/link'

import { createClient } from '@/lib/supabase/server'

import { SignoutButton } from './signout-button'

/**
 * AppHeader — 전역 상단 네비.
 *
 * 폴라로이드 톤에 맞춰 hairline border 만으로 처리 (blur/translucent 없이).
 * RSC. auth 상태에 따라 우측 내용만 바뀐다.
 *
 * env 미설정이면 로고만 노출 — landing 페이지가 이미 설정 안내를 담당하므로
 * 헤더는 조용히 최소 상태를 유지한다.
 */
export async function AppHeader() {
  const supabase = await createClient()

  if (!supabase) {
    return <HeaderShell right={null} />
  }

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return (
      <HeaderShell
        right={
          <Link
            href="/auth/login"
            className="text-[13px] text-[var(--color-mute)] transition-colors hover:text-[var(--color-ink-soft)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent-brand)] focus-visible:ring-offset-2"
          >
            로그인
          </Link>
        }
      />
    )
  }

  const { data: pet } = await supabase
    .from('pets')
    .select('name')
    .eq('user_id', user.id)
    .limit(1)
    .maybeSingle<{ name: string }>()

  return (
    <HeaderShell
      right={
        <div className="flex items-center gap-4">
          {pet?.name ? (
            <Link
              href="/pet"
              className="text-[13px] text-[var(--color-ink-soft)] transition-colors hover:text-[var(--color-accent-brand)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent-brand)] focus-visible:ring-offset-2"
              aria-label={`현재 반려동물: ${pet.name} — 프로필 설정`}
            >
              {pet.name}
            </Link>
          ) : null}
          <SignoutButton />
        </div>
      }
    />
  )
}

function HeaderShell({ right }: { right: React.ReactNode }) {
  return (
    <header className="sticky top-0 z-40 border-b border-[var(--color-line)] bg-[var(--color-bg)]">
      <div className="mx-auto flex h-14 w-full max-w-5xl items-center justify-between px-4 md:h-16 md:px-6">
        <Link
          href="/"
          className="text-[15px] font-semibold tracking-[-0.01em] text-[var(--color-ink)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent-brand)] focus-visible:ring-offset-2"
        >
          buddy-note
        </Link>
        {right}
      </div>
    </header>
  )
}
