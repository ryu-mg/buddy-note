import { describe, expect, it } from 'bun:test'

import {
  buildMembershipSummary,
  formatDate,
  MORE_SECTION_ORDER,
  moreSectionLabel,
} from '@/lib/more/sections'
import type { MembershipSnapshot } from '@/lib/billing/entitlements'

describe('more sections', () => {
  it('keeps the unified more sections in the requested order', () => {
    expect(MORE_SECTION_ORDER.map(moreSectionLabel)).toEqual([
      '알림 설정',
      '멤버십',
      '공지사항',
      'FAQ',
      '내문의',
    ])
  })

  it('builds inactive membership copy', () => {
    expect(buildMembershipSummary(null, false)).toEqual({
      title: '멤버십을 열 수 있어요',
      body: '일기 다시 쓰기, 글꼴 변경, 테마 변경으로 버디의 기록을 더 자기답게 다듬어요.',
      meta: null,
    })
  })

  it('builds active membership copy with renewal date', () => {
    const membership: MembershipSnapshot = {
      status: 'active',
      trialEndsAt: null,
      currentPeriodEndsAt: '2026-06-08T00:00:00.000Z',
      graceEndsAt: null,
    }

    expect(buildMembershipSummary(membership, true)).toEqual({
      title: '버디노트 멤버십 사용 중',
      body: '일기 다시 쓰기, 글꼴 변경, 테마 변경을 사용할 수 있어요.',
      meta: '다음 갱신 기준일 2026.6.8',
    })
  })

  it('formats invalid dates defensively', () => {
    expect(formatDate('not-a-date')).toBe('')
  })
})
