import Image from 'next/image'
import Link from 'next/link'

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
          <div className="flex aspect-[4/5] w-full items-center justify-center bg-[var(--color-line)] text-[12px] text-[var(--color-mute)]">
            사진을 불러오지 못했어요.
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
