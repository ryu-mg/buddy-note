import { headers } from 'next/headers'

import { isDevAuthBypassEnabled } from '@/lib/auth/dev-bypass'

import { KakaoButton } from './kakao-button'

type LoginPageProps = {
  searchParams: Promise<{ error?: string }>
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const { error } = await searchParams
  const headerStore = await headers()
  const supabaseConfigured = Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL)
  const devBypassEnabled = isDevAuthBypassEnabled(headerStore.get('host'))

  if (!supabaseConfigured) {
    return (
      <div className="space-y-3">
        <h1 className="text-2xl font-bold text-[var(--color-ink)]">
          Supabase 설정이 필요해요
        </h1>
        <p className="text-sm leading-[1.6] text-[var(--color-ink-soft)]">
          `.env.local`에 `NEXT_PUBLIC_SUPABASE_URL`과
          `NEXT_PUBLIC_SUPABASE_ANON_KEY`를 채워주시면 로그인할 수 있어요.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {error ? (
        <p
          role="alert"
          className="rounded-[var(--radius-input)] border border-[var(--color-error)]/25 bg-[var(--color-accent-brand-soft)] px-3 py-2 text-[13px] leading-[1.55] text-[var(--color-error)]"
        >
          {error}
        </p>
      ) : null}

      <KakaoButton />
      {devBypassEnabled ? (
        <a
          href="/auth/dev"
          className="flex min-h-11 w-full items-center justify-center rounded-[var(--radius-button)] border border-[var(--color-line)] bg-[var(--color-bg)] px-4 text-[14px] font-medium text-[var(--color-ink-soft)] transition-colors hover:bg-[var(--color-paper)]"
        >
          로컬 개발 로그인
        </a>
      ) : null}
    </div>
  )
}
