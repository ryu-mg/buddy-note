type PawPrintProps = {
  className?: string
  color?: string
  title?: string
}

export function PawPrint({
  className,
  color = 'currentColor',
  title = '기록 있음',
}: PawPrintProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      role="img"
      aria-label={title}
      className={className}
      style={{ color }}
    >
      <path
        d="M7.6 10.2c1.3-.3 2-1.8 1.6-3.4-.4-1.6-1.7-2.6-3-2.3-1.3.3-2 1.8-1.6 3.4.4 1.6 1.7 2.6 3 2.3ZM16.4 10.2c1.3.3 2.6-.7 3-2.3.4-1.6-.3-3.1-1.6-3.4-1.3-.3-2.6.7-3 2.3-.4 1.6.3 3.1 1.6 3.4ZM11.9 8.2c1.3 0 2.3-1.4 2.3-3.1S13.2 2 11.9 2 9.6 3.4 9.6 5.1s1 3.1 2.3 3.1ZM8 20.7c-1.7 0-3-1.2-3-2.9 0-2.9 3.2-7 7-7s7 4.1 7 7c0 1.7-1.3 2.9-3 2.9-1.3 0-2.2-.6-4-.6s-2.7.6-4 .6Z"
        fill="currentColor"
      />
    </svg>
  )
}
