import 'server-only'

import { createClient } from '@supabase/supabase-js'

import type { Database } from '@/types/database'

/**
 * Service-role Supabase client. Bypasses RLS — use only in trusted server
 * code (Server Actions / Route Handlers / Edge Functions).
 *
 * Returns null when env is not configured so callers can surface a friendly
 * "Supabase 설정이 필요해요." message instead of crashing (same pattern as
 * @/lib/supabase/server).
 *
 * NEVER import this module from a client component. The SUPABASE_SERVICE_ROLE_KEY
 * has no NEXT_PUBLIC_ prefix so it is server-only, and `import 'server-only'`
 * above will fail the build if it leaks into a client bundle.
 */
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !serviceKey) {
    return null
  }

  return createClient<Database>(url, serviceKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  })
}
