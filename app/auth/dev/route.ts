import { NextResponse, type NextRequest } from 'next/server'

import { DEV_AUTH_EMAIL, isDevAuthBypassEnabled } from '@/lib/auth/dev-bypass'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const { origin } = new URL(request.url)

  if (!isDevAuthBypassEnabled()) {
    return NextResponse.redirect(new URL('/auth/login', origin))
  }

  const admin = createAdminClient()
  if (!admin) {
    const target = new URL('/auth/login', origin)
    target.searchParams.set('error', '개발 로그인에는 Supabase service role 설정이 필요해요.')
    return NextResponse.redirect(target)
  }

  const redirectTo = new URL('/auth/callback', origin).toString()
  const { data: link, error: linkError } = await admin.auth.admin.generateLink({
    type: 'magiclink',
    email: DEV_AUTH_EMAIL,
    options: {
      redirectTo,
      data: {
        name: 'Local Dev',
        provider: 'dev-bypass',
      },
    },
  })

  if (linkError || !link?.properties?.email_otp) {
    const target = new URL('/auth/login', origin)
    target.searchParams.set('error', '개발 로그인 링크를 만들지 못했어요.')
    return NextResponse.redirect(target)
  }

  const supabase = await createClient()
  if (!supabase) {
    const target = new URL('/auth/login', origin)
    target.searchParams.set('error', 'Supabase 설정이 필요해요.')
    return NextResponse.redirect(target)
  }

  const { error: verifyError } = await supabase.auth.verifyOtp({
    email: DEV_AUTH_EMAIL,
    token: link.properties.email_otp,
    type: 'magiclink',
  })

  if (verifyError) {
    const target = new URL('/auth/login', origin)
    target.searchParams.set('error', '개발 로그인 세션을 만들지 못했어요.')
    return NextResponse.redirect(target)
  }

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
