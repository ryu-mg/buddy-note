import Image from 'next/image'

import { BuddyResting } from '@/components/illustrations/buddy-resting'

type ProfileHeroProps = {
  name: string
  days: number
  diaryCount: number
  personalityCode: string | null
  personalityLabel: string | null
  images: (string | null)[]
}

export function ProfileHero({
  name,
  days,
  diaryCount,
  personalityCode,
  personalityLabel,
  images,
}: ProfileHeroProps) {
  const stackImages = images.filter(Boolean).slice(0, 3) as string[]

  return (
    <header className="grid items-center gap-10 pt-6 md:grid-cols-[1fr_1.1fr] md:pt-12">
      <div className="order-2 flex flex-col items-center text-center md:order-1 md:items-start md:text-left">
        <p className="text-[12px] font-medium uppercase tracking-[0.18em] text-[var(--color-mute)]">
          buddy-note
        </p>
        <h1 className="mt-3 font-serif text-[58px] font-semibold leading-none text-[var(--color-ink)] sm:text-[72px]">
          {name}
        </h1>
        {personalityCode && personalityLabel ? (
          <p className="mt-4 text-[16px] font-medium text-[var(--color-accent-brand)]">
            {personalityCode} · {personalityLabel}
          </p>
        ) : null}
        <div className="mt-7 grid w-full max-w-sm grid-cols-2 gap-3">
          <PublicStat label="함께한 날" value={`${days}일째`} />
          <PublicStat label="폴라로이드" value={`${diaryCount}장`} />
        </div>
      </div>

      <div className="order-1 min-h-[260px] md:order-2 md:min-h-[360px]">
        {stackImages.length > 0 ? (
          <div className="relative mx-auto h-[290px] w-[240px] md:h-[370px] md:w-[300px]">
            {stackImages.map((image, index) => (
              <div
                key={image}
                className={[
                  'public-polaroid absolute inset-0 bg-[var(--color-paper)] p-4 pb-10 shadow-[var(--shadow-polaroid)] ring-1 ring-[var(--color-line)]',
                  index === 0
                    ? 'z-30 motion-safe:-rotate-[4deg]'
                    : index === 1
                      ? 'z-20 translate-x-8 translate-y-5 motion-safe:rotate-[5deg]'
                      : 'z-10 -translate-x-6 translate-y-8 motion-safe:-rotate-[9deg]',
                ].join(' ')}
              >
                <div className="relative aspect-[4/5] w-full overflow-hidden bg-[var(--color-line)]">
                  <Image
                    src={image}
                    alt={`${name} 공개 일기 이미지 ${index + 1}`}
                    fill
                    sizes="(max-width: 768px) 240px, 300px"
                    className="object-cover"
                    priority={index === 0}
                  />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="mx-auto flex h-[260px] w-[260px] items-center justify-center rounded-full bg-[var(--color-paper)] ring-1 ring-[var(--color-line)] md:h-[340px] md:w-[340px]">
            <BuddyResting className="h-44 w-56 md:h-56 md:w-72" />
          </div>
        )}
      </div>
    </header>
  )
}

function PublicStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[var(--radius-button)] bg-[var(--color-paper)] px-4 py-3 ring-1 ring-[var(--color-line)]">
      <p className="text-[12px] text-[var(--color-mute)]">{label}</p>
      <p className="mt-1 font-serif text-[25px] font-semibold leading-none text-[var(--color-ink)]">
        {value}
      </p>
    </div>
  )
}
