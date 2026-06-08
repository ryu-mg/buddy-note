import type { NotificationKind } from '@/types/database'

export type NotificationListItem = {
  id: string
  kind: NotificationKind
  title: string
  body: string
  href: string | null
  readAt: string | null
  createdAt: string
}

export function countUnreadNotifications(
  notifications: readonly Pick<NotificationListItem, 'readAt'>[],
): number {
  return notifications.filter((notification) => notification.readAt === null).length
}

export function shouldShowUnreadNotificationDot(unreadCount: number): boolean {
  return unreadCount > 0
}

export function sortNotificationsByNewest(
  notifications: readonly NotificationListItem[],
): NotificationListItem[] {
  return [...notifications].sort((a, b) => {
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  })
}

export function notificationKindLabel(kind: NotificationKind): string {
  switch (kind) {
    case 'notice':
      return '공지'
    case 'membership':
      return '멤버십'
    case 'diary':
      return '일기'
    case 'support':
      return '문의'
    case 'system':
      return '안내'
  }
}
