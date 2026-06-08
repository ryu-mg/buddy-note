import { redirect } from 'next/navigation'
import { ChevronRight, HelpCircle } from 'lucide-react'

import { BackLink } from '@/components/layout/back-link'
import { createClient } from '@/lib/supabase/server'
import type { SupportFaqCategory } from '@/types/database'

import { InquiryFab } from '../inquiry-fab'

export const dynamic = 'force-dynamic'

type FaqItem = {
  id: string
  category: SupportFaqCategory
  question: string
  answer: string
}

const FALLBACK_FAQS: FaqItem[] = [
  {
    id: 'fallback-diary',
    category: 'diary',
    question: '일기는 어떻게 만들어지나요?',
    answer:
      '사진과 짧은 메모를 남기면 버디가 성격과 지난 기억을 참고해서 하루를 써줘요.',
  },
  {
    id: 'fallback-membership',
    category: 'membership',
    question: '멤버십에서는 무엇이 열리나요?',
    answer:
      '일기 다시 작성하기, 글꼴 변경, 테마 변경처럼 버디의 기록을 더 자기답게 다듬는 기능이 열려요.',
  },
]

export default async function MoreFaqPage() {
  const supabase = await createClient()
  if (!supabase) redirect('/auth/login')

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data } = await supabase
    .from('support_faqs')
    .select('id, category, question, answer')
    .eq('is_published', true)
    .order('sort_order', { ascending: true })
    .limit(50)
    .returns<FaqItem[]>()
  const faqs = data && data.length > 0 ? data : FALLBACK_FAQS

  return (
    <main className="mx-auto min-h-screen w-full max-w-md bg-[var(--color-bg)] px-4 pb-28 pt-8">
      <PageHeader title="FAQ" />

      <section className="overflow-hidden rounded-[var(--radius-card)] border border-[var(--color-line)] bg-[var(--color-paper)]">
        <div className="divide-y divide-[var(--color-line)]">
          {faqs.map((faq) => (
            <details key={faq.id} className="group px-4 py-4">
              <summary className="flex cursor-pointer list-none items-start gap-3">
                <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-[var(--radius-button)] bg-[var(--color-bg)] text-[var(--color-ink-soft)]">
                  <HelpCircle aria-hidden className="size-4" strokeWidth={1.8} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="mb-1 block text-[11px] font-semibold text-[var(--color-accent-brand)]">
                    {faqCategoryLabel(faq.category)}
                  </span>
                  <span className="block text-[15px] font-semibold leading-[1.45] text-[var(--color-ink)]">
                    {faq.question}
                  </span>
                </span>
                <ChevronRight
                  aria-hidden
                  className="mt-2 size-4 shrink-0 text-[var(--color-mute)] transition-transform group-open:rotate-90"
                  strokeWidth={1.8}
                />
              </summary>
              <p className="ml-11 mt-3 whitespace-pre-line text-[14px] leading-[1.7] text-[var(--color-ink-soft)]">
                {faq.answer}
              </p>
            </details>
          ))}
        </div>
      </section>

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

function faqCategoryLabel(category: SupportFaqCategory): string {
  switch (category) {
    case 'usage':
      return '사용'
    case 'membership':
      return '멤버십'
    case 'account':
      return '계정'
    case 'diary':
      return '일기'
  }
}
