import type { CSSProperties } from 'react'

import { cn } from '@/lib/utils'

import { DiaryPhotoFrame } from './diary-photo-frame'

type DiaryDetailCardProps = {
  title: string
  body: string
  dateLabel: string
  petName: string
  imageUrl: string | null
  titleId?: string
  className?: string
  style?: CSSProperties
  priority?: boolean
}

export function DiaryDetailCard({
  title,
  body,
  dateLabel,
  petName,
  imageUrl,
  titleId,
  className,
  style,
  priority = false,
}: DiaryDetailCardProps) {
  return (
    <article
      aria-labelledby={titleId}
      className={cn(
        'relative mx-auto w-full max-w-[420px] overflow-hidden rounded-[var(--radius-card)] border border-[var(--color-line)] bg-[var(--color-paper)] p-2 shadow-[var(--shadow-card)]',
        className,
      )}
      style={style}
    >
      <DiaryPhotoFrame
        title={title}
        petName={petName}
        imageUrl={imageUrl}
        priority={priority}
      />

      <div className="flex flex-col gap-3 px-2 pb-7 pt-5">
        <h1
          id={titleId}
          className="diary-writing-font text-[24px] font-semibold leading-[1.35] text-[var(--color-ink)]"
        >
          {dateLabel} | {title}
        </h1>
        <p className="diary-writing-font whitespace-pre-wrap text-[17px] leading-[1.7] text-[var(--color-ink)]">
          {body}
        </p>
      </div>
    </article>
  )
}
