'use client'

import { useActionState, useState } from 'react'
import { Check, Clock3 } from 'lucide-react'

import {
  NOTIFICATION_PREFERENCE_ITEMS,
  type NotificationPreferences,
  type NotificationPreferenceKey,
} from '@/lib/notifications/preferences'

import {
  saveNotificationPreferences,
  type SaveNotificationPreferencesResult,
} from './actions'

export function NotificationSettingsForm({
  initialPreferences,
}: {
  initialPreferences: NotificationPreferences
}) {
  const [state, formAction, pending] = useActionState<
    SaveNotificationPreferencesResult | undefined,
    FormData
  >(saveNotificationPreferences, undefined)
  const [preferences, setPreferences] =
    useState<NotificationPreferences>(initialPreferences)

  function setBoolean(key: keyof NotificationPreferences, value: boolean) {
    setPreferences((current) => ({
      ...current,
      [key]: value,
    }))
  }

  return (
    <form action={formAction} className="flex flex-col gap-5">
      <input type="hidden" name="allNotificationsEnabled" value="on" />

      <section
        aria-label="알림 항목"
        className="overflow-hidden rounded-[var(--radius-card)] border border-[var(--color-line)] bg-[var(--color-bg)]"
      >
        <div className="divide-y divide-[var(--color-line)]">
          {NOTIFICATION_PREFERENCE_ITEMS.map((item) => (
            <PreferenceRow
              key={item.key}
              itemKey={item.key}
              title={item.title}
              description={item.description}
              checked={preferences[item.key]}
              muted={false}
              onChange={(checked) => setBoolean(item.key, checked)}
            />
          ))}
        </div>
      </section>

      <section
        aria-labelledby="notification-time-title"
        className="rounded-[var(--radius-card)] border border-[var(--color-line)] bg-[var(--color-bg)] px-4 py-4"
      >
        <div className="flex items-center gap-3">
          <Clock3
            aria-hidden
            className="size-5 text-[var(--color-accent-brand)]"
            strokeWidth={1.8}
          />
          <div className="min-w-0 flex-1">
            <h2
              id="notification-time-title"
              className="text-[15px] font-semibold text-[var(--color-ink)]"
            >
              오늘 기록 알림 시간
            </h2>
            <p className="mt-1 text-[12px] leading-[1.45] text-[var(--color-mute)]">
              하루를 남기기 좋은 시간을 정해둘 수 있어요.
            </p>
          </div>
          <input
            type="time"
            name="reminderTime"
            value={preferences.reminderTime}
            onChange={(event) =>
              setPreferences((current) => ({
                ...current,
                reminderTime: event.target.value,
              }))
            }
            className="h-10 rounded-[var(--radius-input)] border border-[var(--color-line)] bg-[var(--color-paper)] px-3 text-[14px] font-semibold text-[var(--color-ink)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent-brand)]"
          />
        </div>
      </section>

      {state?.ok ? (
        <p className="flex items-center gap-2 rounded-[var(--radius-card)] bg-[var(--color-accent-brand-soft)] px-4 py-3 text-[13px] font-semibold text-[var(--color-accent-brand)]">
          <Check aria-hidden className="size-4" strokeWidth={2} />
          알림 설정을 저장했어요.
        </p>
      ) : null}
      {state && !state.ok ? (
        <p
          role="alert"
          className="rounded-[var(--radius-card)] border border-[var(--color-error)]/30 bg-[var(--color-paper)] px-4 py-3 text-[13px] font-semibold text-[var(--color-error)]"
        >
          {state.error}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={pending}
        className="min-h-12 rounded-[var(--radius-button)] bg-[var(--color-accent-cta)] px-5 text-[15px] font-semibold text-white transition-opacity disabled:opacity-60"
      >
        {pending ? '저장 중...' : '설정 저장하기'}
      </button>
    </form>
  )
}

function PreferenceRow({
  itemKey,
  title,
  description,
  checked,
  muted,
  onChange,
}: {
  itemKey: NotificationPreferenceKey
  title: string
  description: string
  checked: boolean
  muted: boolean
  onChange: (checked: boolean) => void
}) {
  return (
    <div
      className={[
        'flex items-center gap-4 px-4 py-4 transition-opacity',
        muted ? 'opacity-55' : 'opacity-100',
      ].join(' ')}
    >
      <div className="min-w-0 flex-1">
        <p className="text-[15px] font-semibold text-[var(--color-ink)]">
          {title}
        </p>
        <p className="mt-1 text-[12px] leading-[1.45] text-[var(--color-mute)]">
          {description}
        </p>
      </div>
      <Toggle
        name={itemKey}
        checked={checked}
        label={title}
        onChange={onChange}
      />
    </div>
  )
}

function Toggle({
  name,
  checked,
  label,
  onChange,
}: {
  name: string
  checked: boolean
  label: string
  onChange: (checked: boolean) => void
}) {
  return (
    <label className="relative inline-flex cursor-pointer items-center">
      <input
        type="checkbox"
        name={name}
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="peer sr-only"
        aria-label={label}
      />
      <span className="h-7 w-12 rounded-[var(--radius-pill)] bg-[var(--color-line)] transition-colors peer-checked:bg-[var(--color-accent-brand)] peer-focus-visible:outline-none peer-focus-visible:ring-2 peer-focus-visible:ring-[var(--color-accent-brand)] peer-focus-visible:ring-offset-2" />
      <span className="absolute left-1 top-1 size-5 rounded-full bg-[var(--color-bg)] shadow-[var(--shadow-card-soft)] transition-transform peer-checked:translate-x-5" />
    </label>
  )
}
