import { createClient } from '@/lib/supabase/server'

import { BottomNav } from './bottom-nav'

export async function BottomNavGate() {
  const supabase = await createClient()
  if (!supabase) return null

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return null

  return <BottomNav />
}
