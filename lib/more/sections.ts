import type { MembershipSnapshot } from '@/lib/billing/entitlements'

export type MoreSectionKey =
  | 'notificationSettings'
  | 'membership'
  | 'notices'
  | 'faq'
  | 'inquiries'

export const MORE_SECTION_ORDER: MoreSectionKey[] = [
  'notificationSettings',
  'membership',
  'notices',
  'faq',
  'inquiries',
]

export function moreSectionLabel(section: MoreSectionKey): string {
  switch (section) {
    case 'notificationSettings':
      return '알림 설정'
    case 'membership':
      return '멤버십'
    case 'notices':
      return '공지사항'
    case 'faq':
      return 'FAQ'
    case 'inquiries':
      return '내문의'
  }
}

export function buildMembershipSummary(
  membership: MembershipSnapshot | null,
  canUseMembershipFeatures: boolean,
): { title: string; body: string; meta: string | null } {
  if (!membership || !canUseMembershipFeatures) {
    return {
      title: '멤버십을 열 수 있어요',
      body: '일기 다시 쓰기, 글꼴 변경, 테마 변경으로 버디의 기록을 더 자기답게 다듬어요.',
      meta: null,
    }
  }

  return {
    title: '버디노트 멤버십 사용 중',
    body: '일기 다시 쓰기, 글꼴 변경, 테마 변경을 사용할 수 있어요.',
    meta: membership.currentPeriodEndsAt
      ? `다음 갱신 기준일 ${formatDate(membership.currentPeriodEndsAt)}`
      : null,
  }
}

export function formatDate(iso: string): string {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return ''
  return `${date.getFullYear()}.${date.getMonth() + 1}.${date.getDate()}`
}
