import { redirect } from 'next/navigation'
import { ScrollText } from 'lucide-react'

import { BackLink } from '@/components/layout/back-link'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

const POLICY_ITEMS = [
  {
    title: '서비스 이용약관',
    body: '버디노트를 이용할 때 지켜야 할 기본 약속과 서비스 제공 범위를 안내해요.',
  },
  {
    title: '개인정보 처리방침',
    body: '로그인 정보, 반려동물 프로필, 사진과 기록이 어떤 기준으로 보관되는지 확인할 수 있어요.',
  },
  {
    title: '결제 및 환불 정책',
    body: '멤버십 결제, 갱신, 취소와 환불 기준을 정리해요.',
  },
]

export default async function MorePoliciesPage() {
  const supabase = await createClient()
  if (!supabase) redirect('/auth/login')

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  return (
    <main className="mx-auto min-h-screen w-full max-w-md bg-[var(--color-bg)] px-4 pb-28 pt-8">
      <header className="mb-6 flex items-center gap-3">
        <BackLink href="/more" label="더보기로 돌아가기" />
        <h1 className="text-[22px] font-semibold leading-none text-[var(--color-ink)]">
          약관 및 정책
        </h1>
      </header>

      <section className="overflow-hidden rounded-[var(--radius-card)] border border-[var(--color-line)] bg-[var(--color-paper)]">
        <div className="divide-y divide-[var(--color-line)]">
          {POLICY_ITEMS.map((item) => (
            <article key={item.title} className="px-4 py-4">
              <div className="mb-3 flex items-center gap-2">
                <span className="flex size-8 items-center justify-center rounded-[var(--radius-button)] bg-[var(--color-bg)] text-[var(--color-ink-soft)]">
                  <ScrollText aria-hidden className="size-4" strokeWidth={1.8} />
                </span>
                <h2 className="text-[15px] font-semibold text-[var(--color-ink)]">
                  {item.title}
                </h2>
              </div>
              <p className="text-[13px] leading-[1.65] text-[var(--color-mute)]">
                {item.body}
              </p>
            </article>
          ))}
        </div>
      </section>
    </main>
  )
}
