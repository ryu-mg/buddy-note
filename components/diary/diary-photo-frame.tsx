'use client'

import Image from 'next/image'
import { useState } from 'react'

import { PawPrint } from '@/components/icons/paw-print'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'

type DiaryPhotoFrameProps = {
  title: string
  petName: string
  imageUrl: string | null
  priority?: boolean
  className?: string
}

export function DiaryPhotoFrame({
  title,
  petName,
  imageUrl,
  priority = false,
  className,
}: DiaryPhotoFrameProps) {
  const [loadedImageUrl, setLoadedImageUrl] = useState<string | null>(null)

  if (!imageUrl) {
    return (
      <div
        className={cn(
          'flex aspect-[4/5] w-full flex-col items-center justify-center gap-3 rounded-[var(--radius-button)] bg-[var(--color-line)] text-[13px] text-[var(--color-mute)]',
          className,
        )}
      >
        <PawPrint
          className="h-10 w-10 opacity-75"
          color="var(--color-accent-brand)"
          title="사진 없이 남긴 기록"
        />
        <span>사진 없이 남긴 기록이에요.</span>
      </div>
    )
  }

  const loaded = loadedImageUrl === imageUrl

  return (
    <div
      aria-busy={!loaded}
      className={cn(
        'relative aspect-[4/5] overflow-hidden rounded-[var(--radius-button)] bg-[var(--color-bg)]',
        className,
      )}
    >
      <Image
        src={imageUrl}
        alt={`${petName}의 ${title} 사진`}
        fill
        sizes="320px"
        className={cn(
          'object-cover opacity-0',
          'motion-safe:transition-opacity motion-safe:duration-300 motion-safe:ease-out motion-reduce:opacity-100',
          loaded ? 'opacity-100' : '',
        )}
        priority={priority}
        onLoad={() => setLoadedImageUrl(imageUrl)}
        onError={() => setLoadedImageUrl(imageUrl)}
      />
      <div
        aria-hidden="true"
        className={cn(
          'pointer-events-none absolute inset-0 bg-[var(--color-paper)]',
          'motion-safe:transition-opacity motion-safe:duration-300 motion-safe:ease-out',
          loaded ? 'opacity-0' : 'opacity-100 motion-safe:animate-pulse',
        )}
      >
        <Skeleton className="absolute inset-0 h-full w-full rounded-none bg-[var(--color-line)]/45" />
        <Skeleton className="absolute left-5 top-5 h-4 w-2/5 rounded-[var(--radius-pill)] bg-[var(--color-bg)]/85" />
        <Skeleton className="absolute bottom-6 left-5 h-3 w-3/5 rounded-[var(--radius-pill)] bg-[var(--color-bg)]/75" />
        <Skeleton className="absolute bottom-12 left-5 h-3 w-4/5 rounded-[var(--radius-pill)] bg-[var(--color-bg)]/65" />
      </div>
    </div>
  )
}
