type BuddyIllustrationProps = {
  className?: string
}

export function BuddyTilted({ className }: BuddyIllustrationProps) {
  return (
    <svg
      viewBox="0 0 180 140"
      role="img"
      aria-label="고개를 갸웃한 버디"
      className={className}
    >
      <g transform="rotate(-8 90 72)">
        <path
          d="M44 78c0-31 23-54 53-54s54 23 54 54-24 49-55 49-52-18-52-49Z"
          fill="var(--color-paper)"
          stroke="var(--color-ink)"
          strokeWidth="4"
        />
        <path
          d="M56 38c-10-16-5-30 10-38 9 15 7 29-4 42M128 39c8-15 22-20 37-12-3 17-15 25-32 22"
          fill="var(--color-paper)"
          stroke="var(--color-ink)"
          strokeWidth="4"
          strokeLinecap="round"
        />
        <path
          d="M80 77h.5M114 77h.5"
          stroke="var(--color-ink)"
          strokeWidth="7"
          strokeLinecap="round"
        />
        <path
          d="M94 84c4 2 8 2 11 0"
          stroke="var(--color-accent-brand)"
          strokeWidth="4"
          strokeLinecap="round"
        />
        <path
          d="M89 99c8 6 20 6 28-1"
          fill="none"
          stroke="var(--color-ink-soft)"
          strokeWidth="4"
          strokeLinecap="round"
        />
      </g>
    </svg>
  )
}
