import 'server-only'

export const DEV_AUTH_EMAIL = 'dev@buddy-note.local'

export function isDevAuthBypassEnabled(): boolean {
  return (
    process.env.NODE_ENV !== 'production' &&
    process.env.DEV_AUTH_BYPASS === '1'
  )
}
