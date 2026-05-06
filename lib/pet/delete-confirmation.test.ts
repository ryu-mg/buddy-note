import { describe, expect, it } from 'bun:test'

import { buildDeleteConfirmationText } from './delete-confirmation'

describe('buildDeleteConfirmationText', () => {
  it('반려동물 이름으로 탈퇴 확인 문구를 만든다', () => {
    expect(buildDeleteConfirmationText('버디')).toBe('버디과의 추억 삭제')
  })

  it('반려동물 이름이 없으면 기본 표현을 쓴다', () => {
    expect(buildDeleteConfirmationText('')).toBe('반려동물과의 추억 삭제')
  })
})
