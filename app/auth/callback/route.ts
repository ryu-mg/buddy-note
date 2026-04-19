import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const errorDescription = searchParams.get('error_description')

  if (errorDescription || !code) {
    const target = new URL('/auth/login', origin)
    target.searchParams.set(
      'error',
      errorDescription ?? '로그인 링크가 유효하지 않아요.',
    )
    return NextResponse.redirect(target)
  }

  const supabase = await createClient()
  if (!supabase) {
    const target = new URL('/auth/login', origin)
    target.searchParams.set('error', 'Supabase 설정이 필요해요.')
    return NextResponse.redirect(target)
  }

  const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(
    code,
  )
  if (exchangeError) {
    const target = new URL('/auth/login', origin)
    target.searchParams.set(
      'error',
      '잠시 문제가 생겼어요. 이메일을 다시 확인해주세요.',
    )
    return NextResponse.redirect(target)
  }

  // Decide where to send the user: new users (no pets yet) → /onboarding,
  // returning users → /. If the query errors (e.g. table missing),
  // default to /onboarding so the user is never stranded.
  let destination = '/onboarding'
  const { data: pets, error: petsError } = await supabase
    .from('pets')
    .select('id')
    .limit(1)

  if (!petsError && pets && pets.length > 0) {
    destination = '/'
  }

  return NextResponse.redirect(new URL(destination, origin))
}
