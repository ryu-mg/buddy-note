import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  const { origin } = new URL(request.url)
  const supabase = await createClient()

  if (supabase) {
    await supabase.auth.signOut()
  }

  return NextResponse.redirect(new URL('/', origin), { status: 303 })
}
