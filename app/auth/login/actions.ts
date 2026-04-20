'use server'

import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export type LoginState = {
  error?: string
}

function maskEmail(email: string): string {
  const [local, domain] = email.split('@')
  if (!local || !domain) return email
  const head = local[0] ?? ''
  return `${head}***@${domain}`
}

async function absoluteCallbackURL(): Promise<string> {
  const envURL = process.env.NEXT_PUBLIC_SITE_URL
  if (envURL) return new URL('/auth/callback', envURL).toString()

  const h = await headers()
  const host = h.get('x-forwarded-host') ?? h.get('host') ?? 'localhost:4000'
  const proto =
    h.get('x-forwarded-proto') ??
    (host.startsWith('localhost') ? 'http' : 'https')
  return `${proto}://${host}/auth/callback`
}

export async function signInWithMagicLink(
  _prev: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const emailRaw = formData.get('email')
  const email = typeof emailRaw === 'string' ? emailRaw.trim() : ''

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { error: '이메일 주소를 다시 확인해주세요.' }
  }

  const supabase = await createClient()
  if (!supabase) {
    return { error: 'Supabase 설정이 필요해요. 관리자에게 문의해주세요.' }
  }

  const emailRedirectTo = await absoluteCallbackURL()

  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo,
      shouldCreateUser: true,
    },
  })

  if (error) {
    return { error: '메일 보내는 중에 문제가 생겼어요. 잠시 후 다시 시도해주세요.' }
  }

  const masked = encodeURIComponent(maskEmail(email))
  redirect(`/auth/verify?email=${masked}`)
}

export type KakaoResult =
  | { ok: true; redirectUrl: string }
  | { ok: false; error: string }

export async function signInWithKakao(
  _formData: FormData,
): Promise<KakaoResult> {
  const supabase = await createClient()
  if (!supabase) {
    return {
      ok: false,
      error: 'Supabase 설정이 필요해요. 관리자에게 문의해주세요.',
    }
  }

  const redirectTo = await absoluteCallbackURL()

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'kakao',
    options: {
      redirectTo,
    },
  })

  if (error || !data?.url) {
    return {
      ok: false,
      error: '카카오 로그인 준비 중 문제가 생겼어요. 잠시 후 다시 시도해주세요.',
    }
  }

  return { ok: true, redirectUrl: data.url }
}
