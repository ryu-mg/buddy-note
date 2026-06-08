import { redirect } from 'next/navigation'
import { Megaphone } from 'lucide-react'

import { BackLink } from '@/components/layout/back-link'
import { createClient } from '@/lib/supabase/server'
import type { NoticeRow } from '@/types/database'

import { InquiryFab } from '../inquiry-fab'

export const dynamic = 'force-dynamic'

export default async function MoreNoticesPage() {
  const supabase = await createClient()
  if (!supabase) redirect('/auth/login')

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: notices } = await supabase
    .from('notices')
    .select('id, title, body, published_at, is_published, created_at, updated_at')
    .eq('is_published', true)
    .lte('published_at', new Date().toISOString())
    .order('published_at', { ascending: false })
    .limit(30)
    .returns<NoticeRow[]>()

  return (
    <main className="mx-auto min-h-screen w-full max-w-md bg-[var(--color-bg)] px-4 pb-28 pt-8">
      <PageHeader title="공지사항" />

      {notices && notices.length > 0 ? (
        <section className="overflow-hidden rounded-[var(--radius-card)] border border-[var(--color-line)] bg-[var(--color-paper)]">
          <div className="divide-y divide-[var(--color-line)]">
            {notices.map((notice) => (
              <article key={notice.id} className="px-4 py-4">
                <div className="mb-3 flex items-center gap-2">
                  <span className="flex size-8 items-center justify-center rounded-[var(--radius-button)] bg-[var(--color-bg)] text-[var(--color-ink-soft)]">
                    <Megaphone aria-hidden className="size-4" strokeWidth={1.8} />
                  </span>
                  <time className="text-[12px] text-[var(--color-mute)]">
                    {formatDate(notice.published_at ?? notice.created_at)}
                  </time>
                </div>
                <h2 className="text-[16px] font-semibold leading-[1.35] text-[var(--color-ink)]">
                  {notice.title}
                </h2>
                <p className="mt-2 whitespace-pre-line text-[14px] leading-[1.7] text-[var(--color-ink-soft)]">
                  {notice.body}
                </p>
              </article>
            ))}
          </div>
        </section>
      ) : (
        <EmptyState title="새 공지는 없어요" body="중요한 소식이 생기면 이곳에 남겨둘게요." />
      )}

      <InquiryFab />
    </main>
  )
}

function PageHeader({ title }: { title: string }) {
  return (
    <header className="mb-6 flex items-center gap-3">
      <BackLink href="/more" label="더보기로 돌아가기" />
      <h1 className="text-[22px] font-semibold leading-none text-[var(--color-ink)]">
        {title}
      </h1>
    </header>
  )
}

function EmptyState({ title, body }: { title: string; body: string }) {
  return (
    <section className="rounded-[var(--radius-card)] border border-[var(--color-line)] bg-[var(--color-paper)] px-4 py-5">
      <h2 className="text-[15px] font-semibold text-[var(--color-ink)]">{title}</h2>
      <p className="mt-1 text-[13px] leading-[1.55] text-[var(--color-mute)]">
        {body}
      </p>
    </section>
  )
}

function formatDate(iso: string): string {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return ''
  return `${date.getFullYear()}.${date.getMonth() + 1}.${date.getDate()}`
}
