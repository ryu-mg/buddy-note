import { KakaoButton } from './kakao-button'

export default function LoginPage() {
  const supabaseConfigured = Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL)

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
    <div className="space-y-5">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold text-[var(--color-ink)]">
          카카오로 시작할게요
        </h1>
        <p className="text-sm leading-[1.6] text-[var(--color-mute)]">
          buddy-note는 MVP에서 카카오 로그인만 지원해요.
        </p>
      </div>

      <KakaoButton />
    </div>
  )
}
