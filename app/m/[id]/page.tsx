import Image from 'next/image'
import { notFound } from 'next/navigation'

import { BuddyHappy } from '@/components/illustrations/buddy-happy'
import { createClient } from '@/lib/supabase/server'

type PageProps = {
  params: Promise<{ id: string }>
}

type MilestonePublicRow = {
  id: string
  milestone_day: number
  title: string
  caption: string
  image_url_916: string | null
  image_url_45: string | null
  image_url_11: string | null
  is_public: boolean
  created_at: string
  pet: {
    name: string
  } | null
}

export default async function MilestonePage({ params }: PageProps) {
  const { id } = await params
  const supabase = await createClient()
  if (!supabase) notFound()

  const { data: card } = await supabase
    .from('milestone_cards')
    .select('id, milestone_day, title, caption, image_url_916, image_url_45, image_url_11, is_public, created_at, pet:pets(name)')
    .eq('id', id)
    .eq('is_public', true)
    .maybeSingle<MilestonePublicRow>()

  if (!card) notFound()

  const imageUrl = card.image_url_916 ?? card.image_url_45 ?? card.image_url_11

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md flex-col items-center justify-center gap-7 px-5 py-12 text-center">
      <p className="text-[12px] font-medium uppercase tracking-[0.18em] text-[var(--color-mute)]">
        milestone
      </p>
      <section className="w-full bg-[var(--color-paper)] px-6 py-6 shadow-[var(--shadow-polaroid)] ring-1 ring-[var(--color-line)] motion-safe:-rotate-[1deg]">
        {imageUrl ? (
          <div className="relative aspect-[9/16] w-full overflow-hidden bg-[var(--color-line)]">
            <Image
              src={imageUrl}
              alt={card.title}
              fill
              sizes="420px"
              className="object-cover"
              priority
            />
          </div>
        ) : (
          <div className="flex aspect-[4/5] w-full items-center justify-center bg-[var(--color-bg)]">
            <BuddyHappy className="h-40 w-52" />
          </div>
        )}
        <h1 className="mt-6 font-serif text-[var(--text-display-sm)] font-semibold leading-[1.2] text-[var(--color-ink)]">
          {card.title}
        </h1>
        <p className="mt-3 text-[15px] leading-[1.65] text-[var(--color-ink-soft)]">
          {card.caption}
        </p>
      </section>

      {card.pet ? (
        <p className="text-[14px] text-[var(--color-mute)]">
          {card.pet.name}의 기념 카드
        </p>
      ) : null}
    </main>
  )
}
