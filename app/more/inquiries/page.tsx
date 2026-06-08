import { redirect } from 'next/navigation'
import { MessageCircle } from 'lucide-react'

import { BackLink } from '@/components/layout/back-link'
import {
  inquiryCategoryLabel,
  inquiryTopicLabel,
  inquiryStatusLabel,
} from '@/lib/support/inquiry'
import { getSignedPhotoUrl } from '@/lib/storage'
import { createClient } from '@/lib/supabase/server'
import type {
  SupportInquiryCategory,
  SupportInquiryStatus,
  SupportInquiryTopic,
} from '@/types/database'

import { InquiryFab } from '../inquiry-fab'

export const dynamic = 'force-dynamic'

type InquiryItem = {
  id: string
  category: SupportInquiryCategory
  topic: SupportInquiryTopic | null
  title: string
  body: string
  status: SupportInquiryStatus
  admin_note: string | null
  created_at: string
}

type InquiryAttachment = {
  id: string
  inquiry_id: string
  storage_path: string
  file_name: string
}

type SignedInquiryAttachment = InquiryAttachment & {
  signedUrl: string | null
}

export default async function MoreInquiriesPage() {
  const supabase = await createClient()
  if (!supabase) redirect('/auth/login')

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: inquiries } = await supabase
    .from('support_inquiries')
    .select('id, category, topic, title, body, status, admin_note, created_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(50)
    .returns<InquiryItem[]>()

  const attachmentsByInquiry = await getInquiryAttachmentsByInquiryId(
    supabase,
    inquiries ?? [],
  )

  return (
    <main className="mx-auto min-h-screen w-full max-w-md bg-[var(--color-bg)] px-4 pb-28 pt-8">
      <PageHeader title="내문의" />

      {inquiries && inquiries.length > 0 ? (
        <section className="overflow-hidden rounded-[var(--radius-card)] border border-[var(--color-line)] bg-[var(--color-paper)]">
          <div className="divide-y divide-[var(--color-line)]">
            {inquiries.map((inquiry) => (
              <article key={inquiry.id} className="px-4 py-4">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <span className="flex size-8 items-center justify-center rounded-[var(--radius-button)] bg-[var(--color-bg)] text-[var(--color-ink-soft)]">
                      <MessageCircle
                        aria-hidden
                        className="size-4"
                        strokeWidth={1.8}
                      />
                    </span>
                    <span className="text-[12px] font-semibold text-[var(--color-accent-brand)]">
                      {inquiryCategoryLabel(inquiry.category)}
                    </span>
                    <span className="rounded-[var(--radius-pill)] bg-[var(--color-bg)] px-2 py-1 text-[11px] font-semibold text-[var(--color-mute)]">
                      {inquiryTopicLabel(inquiry.category, inquiry.topic)}
                    </span>
                  </div>
                  <span className="rounded-[var(--radius-pill)] bg-[var(--color-bg)] px-2 py-1 text-[11px] font-semibold text-[var(--color-mute)]">
                    {inquiryStatusLabel(inquiry.status)}
                  </span>
                </div>
                <h2 className="text-[16px] font-semibold leading-[1.35] text-[var(--color-ink)]">
                  {inquiry.title}
                </h2>
                <p className="mt-2 whitespace-pre-line text-[14px] leading-[1.65] text-[var(--color-ink-soft)]">
                  {inquiry.body}
                </p>
                <InquiryAttachments
                  attachments={attachmentsByInquiry.get(inquiry.id) ?? []}
                />
                {inquiry.admin_note ? (
                  <div className="mt-4 rounded-[var(--radius-card)] border border-[var(--color-line)] bg-[var(--color-bg)] px-3 py-3">
                    <p className="text-[12px] font-semibold text-[var(--color-ink)]">
                      답변
                    </p>
                    <p className="mt-1 whitespace-pre-line text-[13px] leading-[1.6] text-[var(--color-mute)]">
                      {inquiry.admin_note}
                    </p>
                  </div>
                ) : null}
                <time className="mt-3 block text-[11px] text-[var(--color-mute)]">
                  {formatDate(inquiry.created_at)}
                </time>
              </article>
            ))}
          </div>
        </section>
      ) : (
        <EmptyState
          title="남긴 문의가 없어요"
          body="오른쪽 아래 + 버튼을 누르면 바로 문의를 남길 수 있어요."
        />
      )}

      <InquiryFab />
    </main>
  )
}

async function getInquiryAttachmentsByInquiryId(
  supabase: NonNullable<Awaited<ReturnType<typeof createClient>>>,
  inquiries: InquiryItem[],
): Promise<Map<string, SignedInquiryAttachment[]>> {
  if (inquiries.length === 0) return new Map()

  const { data } = await supabase
    .from('support_inquiry_attachments')
    .select('id, inquiry_id, storage_path, file_name')
    .in(
      'inquiry_id',
      inquiries.map((inquiry) => inquiry.id),
    )
    .order('created_at', { ascending: true })
    .returns<InquiryAttachment[]>()

  const signed = await Promise.all(
    (data ?? []).map(async (attachment) => {
      const result = await getSignedPhotoUrl(attachment.storage_path)
      return {
        ...attachment,
        signedUrl: 'url' in result ? result.url : null,
      }
    }),
  )

  const grouped = new Map<string, SignedInquiryAttachment[]>()
  for (const attachment of signed) {
    const current = grouped.get(attachment.inquiry_id) ?? []
    current.push(attachment)
    grouped.set(attachment.inquiry_id, current)
  }

  return grouped
}

function InquiryAttachments({
  attachments,
}: {
  attachments: SignedInquiryAttachment[]
}) {
  const visibleAttachments = attachments.filter((attachment) =>
    Boolean(attachment.signedUrl),
  )
  if (visibleAttachments.length === 0) return null

  return (
    <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
      {visibleAttachments.map((attachment) => (
        <a
          key={attachment.id}
          href={attachment.signedUrl ?? undefined}
          target="_blank"
          rel="noreferrer"
          className="block size-16 shrink-0 overflow-hidden rounded-[var(--radius-button)] border border-[var(--color-line)] bg-[var(--color-bg)]"
          aria-label={`${attachment.file_name} 크게 보기`}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={attachment.signedUrl ?? ''}
            alt={attachment.file_name}
            className="size-full object-cover"
          />
        </a>
      ))}
    </div>
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
