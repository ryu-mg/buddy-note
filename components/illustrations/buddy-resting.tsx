type BuddyIllustrationProps = {
  className?: string
}

export function BuddyResting({ className }: BuddyIllustrationProps) {
  return (
    <svg
      viewBox="0 0 180 140"
      role="img"
      aria-label="쉬고 있는 버디"
      className={className}
    >
      <path
        d="M38 92c8-31 36-48 69-43 28 5 47 24 45 50-2 19-17 28-56 27-42-1-65-12-58-34Z"
        fill="var(--color-paper)"
        stroke="var(--color-ink)"
        strokeWidth="4"
        strokeLinecap="round"
      />
      <path
        d="M54 58c-8-15-3-30 12-39 8 16 5 30-7 42"
        fill="var(--color-paper)"
        stroke="var(--color-ink)"
        strokeWidth="4"
        strokeLinecap="round"
      />
      <path
        d="M125 56c2-16 12-27 29-29 2 18-6 30-23 35"
        fill="var(--color-paper)"
        stroke="var(--color-ink)"
        strokeWidth="4"
        strokeLinecap="round"
      />
      <path
        d="M72 88c8 4 21 5 30 0"
        fill="none"
        stroke="var(--color-accent-brand)"
        strokeWidth="4"
        strokeLinecap="round"
      />
      <path
        d="M73 74h.5M113 74h.5"
        fill="none"
        stroke="var(--color-ink)"
        strokeWidth="6"
        strokeLinecap="round"
      />
      <path
        d="M105 119c4 10 17 12 24 5M57 117c-9 7-7 17 4 19"
        fill="none"
        stroke="var(--color-ink-soft)"
        strokeWidth="4"
        strokeLinecap="round"
      />
    </svg>
  )
}
