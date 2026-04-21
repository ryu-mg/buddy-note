type BuddyIllustrationProps = {
  className?: string
}

export function BuddyHappy({ className }: BuddyIllustrationProps) {
  return (
    <svg
      viewBox="0 0 180 140"
      role="img"
      aria-label="기분 좋은 버디"
      className={className}
    >
      <path
        d="M42 75c0-31 24-52 55-52s54 21 54 52c0 34-23 55-55 55s-54-21-54-55Z"
        fill="var(--color-paper)"
        stroke="var(--color-ink)"
        strokeWidth="4"
      />
      <path
        d="M55 39c-12-14-9-29 5-39 11 13 11 27 1 41M132 41c8-16 21-23 38-17-1 18-13 28-31 27"
        fill="var(--color-paper)"
        stroke="var(--color-ink)"
        strokeWidth="4"
        strokeLinecap="round"
      />
      <path
        d="M77 75c5-6 12-6 17 0M111 75c5-6 12-6 17 0"
        fill="none"
        stroke="var(--color-ink)"
        strokeWidth="4"
        strokeLinecap="round"
      />
      <path
        d="M91 94c12 10 27 10 39-1"
        fill="none"
        stroke="var(--color-accent-brand)"
        strokeWidth="5"
        strokeLinecap="round"
      />
      <path
        d="M71 115c-14 2-28-3-37-13"
        fill="none"
        stroke="var(--color-ink-soft)"
        strokeWidth="4"
        strokeLinecap="round"
      />
    </svg>
  )
}
