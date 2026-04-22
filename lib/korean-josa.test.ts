import { describe, expect, it } from 'bun:test'

import { hasBatchim, selectJosa, withJosa } from '@/lib/korean-josa'

describe('korean-josa', () => {
  it('받침 유무를 판단한다', () => {
    expect(hasBatchim('엄마')).toBe(false)
    expect(hasBatchim('형')).toBe(true)
    expect(hasBatchim('반려인')).toBe(true)
    expect(hasBatchim('마루')).toBe(false)
    expect(hasBatchim('콩')).toBe(true)
  })

  it('비한글/영문은 받침 없음 fallback을 사용한다', () => {
    expect(hasBatchim('Buddy')).toBe(false)
    expect(selectJosa('Buddy', '이/가')).toBe('가')
    expect(withJosa('Buddy', '이/가')).toBe('Buddy가')
  })

  it('은/는, 이/가, 을/를, 와/과, 이야/야를 고른다', () => {
    expect(withJosa('누나', '은/는')).toBe('누나는')
    expect(withJosa('반려인', '은/는')).toBe('반려인은')
    expect(withJosa('엄마', '이/가')).toBe('엄마가')
    expect(withJosa('형', '이/가')).toBe('형이')
    expect(withJosa('마루', '을/를')).toBe('마루를')
    expect(withJosa('콩', '을/를')).toBe('콩을')
    expect(withJosa('마루', '와/과')).toBe('마루와')
    expect(withJosa('콩', '와/과')).toBe('콩과')
    expect(withJosa('마루', '이야/야')).toBe('마루야')
    expect(withJosa('콩', '이야/야')).toBe('콩이야')
  })

  it('끝 공백과 문장부호는 조사 판단에서 제외한다', () => {
    expect(withJosa('마루 ', '이/가')).toBe('마루가')
    expect(selectJosa('마루.', '이/가')).toBe('가')
    expect(selectJosa('콩.', '이/가')).toBe('이')
  })
})
