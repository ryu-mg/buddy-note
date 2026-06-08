import { describe, expect, it } from 'bun:test'

import {
  DEFAULT_NOTIFICATION_PREFERENCES,
  NOTIFICATION_PREFERENCE_ITEMS,
  notificationPreferencesFromRow,
  notificationPreferencesToRow,
  parseNotificationPreferencesForm,
  shouldDeliverNotification,
} from '@/lib/notifications/preferences'
import type { NotificationPreferenceRow } from '@/types/database'

describe('notification preferences', () => {
  it('defines the settings shown in the more tab', () => {
    expect(NOTIFICATION_PREFERENCE_ITEMS.map((item) => item.key)).toEqual([
      'diaryReminderEnabled',
      'diaryCompleteEnabled',
      'noticeEnabled',
      'membershipEnabled',
      'supportEnabled',
    ])
  })

  it('uses enabled defaults when the user has no saved row', () => {
    expect(notificationPreferencesFromRow(null)).toEqual(
      DEFAULT_NOTIFICATION_PREFERENCES,
    )
  })

  it('maps database rows to view settings', () => {
    const row: NotificationPreferenceRow = {
      user_id: 'user-1',
      all_notifications_enabled: false,
      diary_reminder_enabled: true,
      diary_complete_enabled: false,
      notice_enabled: true,
      membership_enabled: false,
      support_enabled: true,
      reminder_time: '20:30',
      created_at: '2026-06-08T00:00:00.000Z',
      updated_at: '2026-06-08T00:00:00.000Z',
    }

    expect(notificationPreferencesFromRow(row)).toEqual({
      allNotificationsEnabled: false,
      diaryReminderEnabled: true,
      diaryCompleteEnabled: false,
      noticeEnabled: true,
      membershipEnabled: false,
      supportEnabled: true,
      reminderTime: '20:30',
    })
  })

  it('parses checkbox form data and keeps unchecked values false', () => {
    const formData = new FormData()
    formData.set('allNotificationsEnabled', 'on')
    formData.set('diaryReminderEnabled', 'on')
    formData.set('noticeEnabled', 'on')
    formData.set('reminderTime', '22:10')

    expect(parseNotificationPreferencesForm(formData)).toEqual({
      ok: true,
      preferences: {
        allNotificationsEnabled: true,
        diaryReminderEnabled: true,
        diaryCompleteEnabled: false,
        noticeEnabled: true,
        membershipEnabled: false,
        supportEnabled: false,
        reminderTime: '22:10',
      },
    })
  })

  it('rejects invalid reminder times', () => {
    const formData = new FormData()
    formData.set('reminderTime', '29:10')

    expect(parseNotificationPreferencesForm(formData)).toEqual({
      ok: false,
      error: '알림 시간을 다시 확인해주세요.',
    })
  })

  it('maps settings back to a database upsert payload', () => {
    expect(
      notificationPreferencesToRow('user-1', {
        ...DEFAULT_NOTIFICATION_PREFERENCES,
        allNotificationsEnabled: false,
        reminderTime: '19:00',
      }),
    ).toEqual({
      user_id: 'user-1',
      all_notifications_enabled: false,
      diary_reminder_enabled: true,
      diary_complete_enabled: true,
      notice_enabled: true,
      membership_enabled: true,
      support_enabled: true,
      reminder_time: '19:00',
    })
  })

  it('decides whether a notification should be delivered by kind', () => {
    expect(
      shouldDeliverNotification(DEFAULT_NOTIFICATION_PREFERENCES, 'diary'),
    ).toBe(true)
    expect(
      shouldDeliverNotification(
        {
          ...DEFAULT_NOTIFICATION_PREFERENCES,
          diaryCompleteEnabled: false,
        },
        'diary',
      ),
    ).toBe(false)
    expect(
      shouldDeliverNotification(
        {
          ...DEFAULT_NOTIFICATION_PREFERENCES,
          allNotificationsEnabled: false,
        },
        'system',
      ),
    ).toBe(false)
    expect(
      shouldDeliverNotification(DEFAULT_NOTIFICATION_PREFERENCES, 'system'),
    ).toBe(true)
  })
})
