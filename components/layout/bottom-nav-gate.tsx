import { createClient } from '@/lib/supabase/server'

import { BottomNav } from './bottom-nav'

export async function BottomNavGate() {
  const supabase = await createClient()
  if (!supabase) return null

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return null

  const { data: pet } = await supabase
    .from('pets')
    .select('id')
    .eq('user_id', user.id)
    .limit(1)
    .maybeSingle<{ id: string }>()

  if (!pet) return null
  return <BottomNav />
}
