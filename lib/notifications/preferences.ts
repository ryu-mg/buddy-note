import { z } from 'zod'

import type { NotificationKind, NotificationPreferenceRow } from '@/types/database'

export type NotificationPreferences = {
  allNotificationsEnabled: boolean
  diaryReminderEnabled: boolean
  diaryCompleteEnabled: boolean
  noticeEnabled: boolean
  membershipEnabled: boolean
  supportEnabled: boolean
  reminderTime: string
}

export type NotificationPreferenceKey =
  | 'diaryReminderEnabled'
  | 'diaryCompleteEnabled'
  | 'noticeEnabled'
  | 'membershipEnabled'
  | 'supportEnabled'

export const DEFAULT_NOTIFICATION_PREFERENCES: NotificationPreferences = {
  allNotificationsEnabled: true,
  diaryReminderEnabled: true,
  diaryCompleteEnabled: true,
  noticeEnabled: true,
  membershipEnabled: true,
  supportEnabled: true,
  reminderTime: '21:00',
}

export const NOTIFICATION_PREFERENCE_ITEMS: Array<{
  key: NotificationPreferenceKey
  title: string
  description: string
}> = [
  {
    key: 'diaryReminderEnabled',
    title: '오늘 기록 알림',
    description: '하루가 지나가기 전에 버디가 짧게 불러줘요.',
  },
  {
    key: 'diaryCompleteEnabled',
    title: '일기 완성 알림',
    description: '사진과 메모가 일기로 남겨졌을 때 알려줘요.',
  },
  {
    key: 'noticeEnabled',
    title: '공지 사항',
    description: '버디노트의 중요한 변경만 조용히 전해요.',
  },
  {
    key: 'membershipEnabled',
    title: '멤버십과 결제',
    description: '결제 성공, 갱신, 실패처럼 놓치면 안 되는 소식이에요.',
  },
  {
    key: 'supportEnabled',
    title: '문의 답변',
    description: '남긴 문의에 답변이 오면 알려줘요.',
  },
]

const ReminderTimeSchema = z
  .string()
  .regex(/^([01][0-9]|2[0-3]):[0-5][0-9]$/)

export type ParseNotificationPreferencesResult =
  | { ok: true; preferences: NotificationPreferences }
  | { ok: false; error: string }

function checked(formData: FormData, key: string): boolean {
  return formData.get(key) === 'on'
}

export function parseNotificationPreferencesForm(
  formData: FormData,
): ParseNotificationPreferencesResult {
  const reminderTime = String(
    formData.get('reminderTime') ??
      DEFAULT_NOTIFICATION_PREFERENCES.reminderTime,
  )

  if (!ReminderTimeSchema.safeParse(reminderTime).success) {
    return {
      ok: false,
      error: '알림 시간을 다시 확인해주세요.',
    }
  }

  return {
    ok: true,
    preferences: {
      allNotificationsEnabled: checked(formData, 'allNotificationsEnabled'),
      diaryReminderEnabled: checked(formData, 'diaryReminderEnabled'),
      diaryCompleteEnabled: checked(formData, 'diaryCompleteEnabled'),
      noticeEnabled: checked(formData, 'noticeEnabled'),
      membershipEnabled: checked(formData, 'membershipEnabled'),
      supportEnabled: checked(formData, 'supportEnabled'),
      reminderTime,
    },
  }
}

export function notificationPreferencesFromRow(
  row: NotificationPreferenceRow | null,
): NotificationPreferences {
  if (!row) return DEFAULT_NOTIFICATION_PREFERENCES

  return {
    allNotificationsEnabled: row.all_notifications_enabled,
    diaryReminderEnabled: row.diary_reminder_enabled,
    diaryCompleteEnabled: row.diary_complete_enabled,
    noticeEnabled: row.notice_enabled,
    membershipEnabled: row.membership_enabled,
    supportEnabled: row.support_enabled,
    reminderTime: row.reminder_time,
  }
}

export function notificationPreferencesToRow(
  userId: string,
  preferences: NotificationPreferences,
) {
  return {
    user_id: userId,
    all_notifications_enabled: preferences.allNotificationsEnabled,
    diary_reminder_enabled: preferences.diaryReminderEnabled,
    diary_complete_enabled: preferences.diaryCompleteEnabled,
    notice_enabled: preferences.noticeEnabled,
    membership_enabled: preferences.membershipEnabled,
    support_enabled: preferences.supportEnabled,
    reminder_time: preferences.reminderTime,
  }
}

export function shouldDeliverNotification(
  preferences: NotificationPreferences,
  kind: NotificationKind,
): boolean {
  if (!preferences.allNotificationsEnabled) return false

  switch (kind) {
    case 'diary':
      return preferences.diaryCompleteEnabled
    case 'notice':
      return preferences.noticeEnabled
    case 'membership':
      return preferences.membershipEnabled
    case 'support':
      return preferences.supportEnabled
    case 'system':
      return true
  }
}
