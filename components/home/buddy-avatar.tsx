import { BuddyResting } from '@/components/illustrations/buddy-resting'

type BuddyAvatarProps = {
  name: string
  imageUrl?: string | null
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

const sizeClass = {
  sm: 'h-12 w-12',
  md: 'h-20 w-20',
  lg: 'h-28 w-28',
}

export function BuddyAvatar({
  name,
  imageUrl,
  size = 'md',
  className = '',
}: BuddyAvatarProps) {
  return (
    <div
      className={[
        'flex shrink-0 items-center justify-center overflow-hidden rounded-full border border-[var(--color-line)] bg-[var(--color-bg)] shadow-[var(--shadow-card)]',
        sizeClass[size],
        className,
      ].join(' ')}
    >
      {imageUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={imageUrl} alt={`${name} 대표 사진`} className="h-full w-full object-cover" />
      ) : (
        <BuddyResting className="h-[84%] w-[84%]" />
      )}
    </div>
  )
}
