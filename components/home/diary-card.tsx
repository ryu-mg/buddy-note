import Image from 'next/image'
import Link from 'next/link'

import { PawPrint } from '@/components/icons/paw-print'
import { cn } from '@/lib/utils'

type DiaryCardProps = {
  id: string
  title: string
  body: string
  imageUrl: string | null
  createdAt: string
}

function formatDate(iso: string): string {
  try {
    const d = new Date(iso)
    if (Number.isNaN(d.getTime())) return ''
    const m = d.getMonth() + 1
    const day = d.getDate()
    return `${m}월 ${day}일`
  } catch {
    return ''
  }
}

export function DiaryCard({
  id,
  title,
  body,
  imageUrl,
  createdAt,
}: DiaryCardProps) {
  const dateLabel = formatDate(createdAt)

  return (
    <Link
      href={`/diary/${id}`}
      aria-label={`${title} 일기 보기`}
      className="group/card relative block w-full"
    >
      <article
        className={cn(
          'bg-[var(--color-paper)] p-6 pb-11 shadow-[var(--shadow-card)] ring-1 ring-[var(--color-line)]',
          'motion-safe:transition-transform motion-safe:duration-200 motion-safe:ease-[var(--ease-soft-out)]',
          'motion-safe:group-hover/card:-translate-y-0.5',
        )}
      >
        {imageUrl ? (
          <div className="relative aspect-[4/5] w-full overflow-hidden bg-[var(--color-line)]">
            <Image
              src={imageUrl}
              alt={`${title} 사진`}
              fill
              sizes="(max-width: 768px) 90vw, 420px"
              className="object-cover"
            />
          </div>
        ) : (
          <div className="flex aspect-[4/5] w-full flex-col items-center justify-center gap-3 bg-[var(--color-accent-brand-soft)] px-4 text-center text-[13px] leading-[1.5] text-[var(--color-ink-soft)]">
            <PawPrint
              className="h-9 w-9 opacity-80"
              color="var(--color-accent-brand)"
              title="사진 없이 남긴 기록"
            />
            <span>사진 대신 마음을 꾹 남긴 날이에요.</span>
          </div>
        )}

        <h3 className="mt-5 line-clamp-1 text-[17px] font-semibold leading-[1.35] text-[var(--color-ink)] sm:text-[18px]">
          {title}
        </h3>

        <p
          className="mt-2 line-clamp-2 text-[14px] leading-[1.65] text-[var(--color-ink-soft)] sm:text-[15px]"
          style={{ fontFamily: 'var(--font-serif)' }}
        >
          {body}
        </p>

        <p className="mt-4 text-[12px] font-medium uppercase tracking-[0.12em] text-[var(--color-mute)]">
          {dateLabel}
        </p>
      </article>
    </Link>
  )
}
