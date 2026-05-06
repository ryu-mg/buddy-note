import Image from 'next/image'

import { BuddyResting } from '@/components/illustrations/buddy-resting'
import { CountUp } from '@/lib/motion/count-up'

type PassportCardProps = {
  name: string
  personalityCode: string | null
  personalityLabel: string | null
  daysSinceCreated: number
  avatarUrl: string | null
}

export function PassportCard({
  name,
  personalityCode,
  personalityLabel,
  daysSinceCreated,
  avatarUrl,
}: PassportCardProps) {
  return (
    <article className="relative mx-auto w-full max-w-md bg-[var(--color-paper)] p-6 pb-10 shadow-[var(--shadow-polaroid)] ring-1 ring-[var(--color-line)] motion-safe:-rotate-[1.2deg]">
      {/* PASSPORT 헤더 stamp */}
      <div className="flex items-center justify-between">
        <p className="text-[10px] font-bold uppercase tracking-[0.32em] text-[var(--color-mute)]">
          passport · buddy
        </p>
      </div>

      {/* 사진 1:1 */}
      <div className="relative mt-4 aspect-square w-full overflow-hidden bg-[var(--color-line)]">
        {avatarUrl ? (
          <Image
            src={avatarUrl}
            alt={`${name} 사진`}
            fill
            sizes="(max-width: 640px) 90vw, 420px"
            className="object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <BuddyResting className="h-32 w-44" />
          </div>
        )}
      </div>

      {/* 강아지 이름 hero */}
      <h1 className="mt-5 font-serif text-[var(--text-display-md)] font-semibold leading-none text-[var(--color-ink)]">
        {name}
      </h1>

      {/* MBTI stamp 같은 큰 라벨 */}
      {personalityCode && personalityLabel ? (
        <p className="mt-2 font-serif text-[18px] font-semibold text-[var(--color-accent-brand)]">
          {personalityCode}{' '}
          <span className="text-[14px] font-normal text-[var(--color-ink-soft)]">
            · {personalityLabel}
          </span>
        </p>
      ) : null}

      {/* meta 2열 */}
      <dl className="mt-5 grid gap-3 border-t border-[var(--color-line)] pt-4">
        <div>
          <dt className="text-[11px] uppercase tracking-[0.16em] text-[var(--color-mute)]">
            함께한 날
          </dt>
          <dd className="mt-1">
            <CountUp
              to={daysSinceCreated}
              suffix="일째"
              className="font-serif text-[22px] font-semibold text-[var(--color-ink)]"
            />
          </dd>
        </div>
      </dl>
    </article>
  )
}
