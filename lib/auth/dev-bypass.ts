import 'server-only'

export const DEV_AUTH_EMAIL = 'dev@buddy-note.local'

export function isLocalhost(host: string | null | undefined): boolean {
  if (!host) return false

  try {
    const hostname = new URL(`http://${host}`).hostname
    return hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '[::1]'
  } catch {
    return host === 'localhost' || host === '127.0.0.1' || host === '[::1]'
  }
}

export function isDevAuthBypassEnabled(host?: string | null): boolean {
  return (
    process.env.NODE_ENV !== 'production' &&
    process.env.DEV_AUTH_BYPASS === '1' &&
    (host === undefined || isLocalhost(host))
  )
}
