'use client'

import { useActionState } from 'react'
import { useFormStatus } from 'react-dom'

import { signInWithMagicLink, type LoginState } from './actions'
import { KakaoButton } from './kakao-button'

const initialState: LoginState = {}

function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <button
      type="submit"
      disabled={pending}
      aria-busy={pending}
      className="w-full rounded-[10px] bg-[var(--accent,#e07a5f)] px-4 py-3 text-sm font-semibold text-white transition-opacity duration-200 hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
    >
      {pending ? '보내는 중…' : '매직 링크 보내기'}
    </button>
  )
}

export default function LoginPage() {
  const supabaseConfigured = Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL)
  const [state, formAction] = useActionState(signInWithMagicLink, initialState)

  if (!supabaseConfigured) {
    return (
      <div className="space-y-3">
        <h1 className="text-2xl font-bold text-[var(--ink,#1a1a1a)]">
          Supabase 설정이 필요해요
        </h1>
        <p className="text-sm text-zinc-600">
          `.env.local`에 `NEXT_PUBLIC_SUPABASE_URL`과
          `NEXT_PUBLIC_SUPABASE_ANON_KEY`를 채워주시면 로그인할 수 있어요.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold text-[var(--ink,#1a1a1a)]">
          buddy-note에 로그인
        </h1>
        <p className="text-sm text-zinc-500">
          이메일만 있으면 바로 시작할 수 있어요.
        </p>
      </div>

      <form action={formAction} className="space-y-4">
        <div className="space-y-2">
          <label
            htmlFor="email"
            className="block text-sm font-medium text-[var(--ink,#1a1a1a)]"
          >
            이메일
          </label>
          <input
            id="email"
            name="email"
            type="email"
            inputMode="email"
            autoComplete="email"
            required
            aria-required="true"
            aria-invalid={Boolean(state.error)}
            aria-describedby={state.error ? 'login-email-error' : undefined}
            placeholder="you@example.com"
            className="w-full rounded-[8px] border border-zinc-200 bg-white px-3 py-2.5 text-sm text-[var(--ink,#1a1a1a)] placeholder:text-zinc-400 focus:border-[var(--accent,#e07a5f)] focus:outline-none focus:ring-2 focus:ring-[var(--accent,#e07a5f)]/30"
          />
        </div>

        {state.error ? (
          <p
            id="login-email-error"
            role="alert"
            className="rounded-[8px] bg-[#fde6e0] px-3 py-2 text-sm text-[var(--error,#b04a4a)]"
          >
            {state.error}
          </p>
        ) : null}

        <SubmitButton />

        <p className="text-center text-xs text-zinc-500">
          링크를 클릭하면 바로 로그인돼요
        </p>
      </form>

      <div
        role="separator"
        aria-orientation="horizontal"
        className="flex items-center gap-3 text-xs text-zinc-400"
      >
        <span className="h-px flex-1 bg-zinc-200" />
        <span>또는</span>
        <span className="h-px flex-1 bg-zinc-200" />
      </div>

      <KakaoButton />
    </div>
  )
}
