import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

type BackLinkProps = {
  href: string
  label?: string
}

export function BackLink({
  href,
  label = '이전 화면으로 돌아가기',
}: BackLinkProps) {
  return (
    <Link
      href={href}
      aria-label={label}
      className="-ml-2 inline-flex size-10 items-center justify-center text-[var(--color-ink-soft)] transition-colors hover:text-[var(--color-ink)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent-brand)]"
    >
      <ArrowLeft aria-hidden className="size-5" strokeWidth={1.9} />
    </Link>
  )
}
