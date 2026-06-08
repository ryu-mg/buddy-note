import Link from 'next/link'
import { redirect } from 'next/navigation'

import { BackLink } from '@/components/layout/back-link'
import {
  countUnreadNotifications,
  sortNotificationsByNewest,
  type NotificationListItem,
} from '@/lib/notifications/state'
import { createClient } from '@/lib/supabase/server'

import { MarkReadButton } from './mark-read-button'

export const dynamic = 'force-dynamic'

type NotificationRow = {
  id: string
  kind: NotificationListItem['kind']
  title: string
  body: string
  href: string | null
  read_at: string | null
  created_at: string
}

export default async function NotificationsPage() {
  const supabase = await createClient()
  if (!supabase) redirect('/auth/login')

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data } = await supabase
    .from('notifications')
    .select('id, kind, title, body, href, read_at, created_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(30)
    .returns<NotificationRow[]>()

  const notifications = sortNotificationsByNewest(
    (data ?? []).map((item) => ({
      id: item.id,
      kind: item.kind,
      title: item.title,
      body: item.body,
      href: item.href,
      readAt: item.read_at,
      createdAt: item.created_at,
    })),
  )
  const unreadCount = countUnreadNotifications(notifications)

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md flex-col gap-6 px-4 pb-24 pt-8">
      <header className="flex flex-col gap-3">
        <div className="flex items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-1">
            <BackLink href="/" label="홈으로 돌아가기" />
            <h1 className="truncate text-[24px] font-semibold leading-[1.25] text-[var(--color-ink)]">
              최근 알림
            </h1>
          </div>
          <MarkReadButton disabled={unreadCount === 0} />
        </div>
        <p className="text-[13px] leading-[1.55] text-[var(--color-mute)]">
          버디가 놓치면 아쉬운 소식만 짧게 남겨둘게요.
        </p>
      </header>

      {notifications.length === 0 ? (
        <section className="rounded-[var(--radius-card)] border border-[var(--color-line)] bg-[var(--color-paper)] px-5 py-8 text-center">
          <p className="text-[22px] font-semibold text-[var(--color-ink)]">
            아직 들려줄 소식은 없어요
          </p>
          <p className="mt-2 text-[13px] leading-[1.55] text-[var(--color-mute)]">
            일기, 멤버십, 문의 답변이 생기면 여기에 모아둘게요.
          </p>
        </section>
      ) : (
        <ol className="flex flex-col gap-3">
          {notifications.map((notification) => {
            const unread = notification.readAt === null
            const content = (
              <article className="rounded-[var(--radius-card)] border border-[var(--color-line)] bg-[var(--color-bg)] px-4 py-4 shadow-[var(--shadow-card-soft)]">
                <div className="flex items-start gap-3">
                  <span
                    aria-hidden
                    className={[
                      'mt-1 h-2.5 w-2.5 rounded-full',
                      unread
                        ? 'bg-[var(--color-error)]'
                        : 'bg-[var(--color-line)]',
                    ].join(' ')}
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <time className="text-[11px] text-[var(--color-mute)]">
                        {formatShortDate(notification.createdAt)}
                      </time>
                    </div>
                    <h2 className="mt-2 text-[16px] font-semibold leading-[1.35] text-[var(--color-ink)]">
                      {notification.title}
                    </h2>
                    <p className="mt-1 text-[13px] leading-[1.6] text-[var(--color-ink-soft)]">
                      {notification.body}
                    </p>
                  </div>
                </div>
              </article>
            )

            return (
              <li key={notification.id}>
                {notification.href ? (
                  <Link href={notification.href}>{content}</Link>
                ) : (
                  content
                )}
              </li>
            )
          })}
        </ol>
      )}
    </main>
  )
}

function formatShortDate(iso: string): string {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return ''
  return `${date.getMonth() + 1}.${date.getDate()}`
}
