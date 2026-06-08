import { describe, expect, it } from 'bun:test'

import {
  countUnreadNotifications,
  notificationKindLabel,
  shouldShowUnreadNotificationDot,
  sortNotificationsByNewest,
  type NotificationListItem,
} from '@/lib/notifications/state'

describe('notification state', () => {
  it('counts unread notifications and shows a red dot only when unread exists', () => {
    expect(
      countUnreadNotifications([
        { readAt: null },
        { readAt: '2026-06-06T00:00:00.000Z' },
      ]),
    ).toBe(1)
    expect(shouldShowUnreadNotificationDot(1)).toBe(true)
    expect(shouldShowUnreadNotificationDot(0)).toBe(false)
  })

  it('sorts recent notifications newest first', () => {
    const items: NotificationListItem[] = [
      {
        id: 'old',
        kind: 'notice',
        title: '이전',
        body: 'old',
        href: null,
        readAt: null,
        createdAt: '2026-06-01T00:00:00.000Z',
      },
      {
        id: 'new',
        kind: 'system',
        title: '최신',
        body: 'new',
        href: null,
        readAt: null,
        createdAt: '2026-06-06T00:00:00.000Z',
      },
    ]

    expect(sortNotificationsByNewest(items).map((item) => item.id)).toEqual([
      'new',
      'old',
    ])
  })

  it('maps notification kinds to Korean labels', () => {
    expect(notificationKindLabel('membership')).toBe('멤버십')
    expect(notificationKindLabel('support')).toBe('문의')
  })
})
