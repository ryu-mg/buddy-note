import { isDevAuthBypassEnabled } from '@/lib/auth/dev-bypass'

import { KakaoButton } from './kakao-button'

export default function LoginPage() {
  const supabaseConfigured = Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL)
  const devBypassEnabled = isDevAuthBypassEnabled()

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
    <div className="space-y-3">
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
