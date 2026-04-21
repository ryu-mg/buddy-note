import { describe, expect, test } from 'bun:test'

import {
  hasValidBearerToken,
  isValidBearerToken,
  readBearerToken,
} from '@/lib/ops/cron-auth'

describe('readBearerToken', () => {
  test('Authorization bearer token을 추출한다', () => {
    const headers = new Headers({ authorization: 'Bearer secret-123' })
    expect(readBearerToken(headers)).toBe('secret-123')
  })

  test('Bearer 형식이 아니면 빈 문자열', () => {
    const headers = new Headers({ authorization: 'Basic abc' })
    expect(readBearerToken(headers)).toBe('')
  })
})

describe('isValidBearerToken', () => {
  test('동일 token이면 true', () => {
    expect(isValidBearerToken('secret-123', 'secret-123')).toBe(true)
  })

  test('길이가 다르거나 값이 다르면 false', () => {
    expect(isValidBearerToken('short', 'secret-123')).toBe(false)
    expect(isValidBearerToken('secret-124', 'secret-123')).toBe(false)
  })
})

describe('hasValidBearerToken', () => {
  test('headers에서 token을 읽어 비교한다', () => {
    const headers = new Headers({ authorization: 'Bearer secret-123' })
    expect(hasValidBearerToken(headers, 'secret-123')).toBe(true)
  })
})
