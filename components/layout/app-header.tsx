import Link from 'next/link'
import { Bell } from 'lucide-react'

import { BuddyHappy } from '@/components/illustrations/buddy-happy'
import { shouldShowUnreadNotificationDot } from '@/lib/notifications/state'
import { createClient } from '@/lib/supabase/server'

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

  const { count: unreadCount } = await supabase
    .from('notifications')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .is('read_at', null)

  return (
    <HeaderShell
      right={
        <Link
          href="/notifications"
          aria-label={
            unreadCount && unreadCount > 0
              ? `읽지 않은 알림 ${unreadCount}개 확인하기`
              : '최근 알림 확인하기'
          }
          className="relative inline-flex size-9 items-center justify-center rounded-[var(--radius-button)] text-[var(--color-ink-soft)] transition-colors hover:bg-[var(--color-paper)] hover:text-[var(--color-ink)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent-brand)] focus-visible:ring-offset-2"
        >
          <Bell aria-hidden className="size-4" strokeWidth={1.9} />
          {shouldShowUnreadNotificationDot(unreadCount ?? 0) ? (
            <span className="absolute right-2 top-2 h-2.5 w-2.5 rounded-full bg-[var(--color-error)] ring-2 ring-[var(--color-bg)]" />
          ) : null}
        </Link>
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
          className="flex items-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent-brand)] focus-visible:ring-offset-2"
        >
          <BuddyHappy className="h-5 w-5 shrink-0" />
          <span className="text-[15px] font-semibold tracking-[-0.01em] text-[var(--color-ink)]">버디노트</span>
        </Link>
        {right}
      </div>
    </header>
  )
}
