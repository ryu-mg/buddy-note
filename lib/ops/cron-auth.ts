import { timingSafeEqual } from 'node:crypto'

export function readBearerToken(headers: Headers): string {
  const authorization = headers.get('authorization')
  if (!authorization?.startsWith('Bearer ')) return ''
  return authorization.slice('Bearer '.length).trim()
}

export function isValidBearerToken(actual: string, expected: string): boolean {
  if (!actual || !expected) return false

  const actualBuffer = Buffer.from(actual)
  const expectedBuffer = Buffer.from(expected)
  if (actualBuffer.length !== expectedBuffer.length) return false

  return timingSafeEqual(actualBuffer, expectedBuffer)
}

export function hasValidBearerToken(headers: Headers, expected: string): boolean {
  return isValidBearerToken(readBearerToken(headers), expected)
}
