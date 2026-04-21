'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, UserRound } from 'lucide-react'

const HIDDEN_PREFIXES = ['/auth', '/onboarding', '/b/']

export function BottomNav() {
  const pathname = usePathname()
  if (HIDDEN_PREFIXES.some((prefix) => pathname.startsWith(prefix))) {
    return null
  }

  const items = [
    { href: '/', label: '홈', icon: Home },
    { href: '/pet', label: '마이페이지', icon: UserRound },
  ]

  return (
    <nav
      aria-label="주요 메뉴"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-[var(--color-line)] bg-[var(--color-bg)]"
    >
      <div className="mx-auto grid h-16 max-w-md grid-cols-2 px-4 pb-[env(safe-area-inset-bottom)]">
        {items.map((item) => {
          const active =
            item.href === '/'
              ? pathname === '/'
              : pathname === item.href || pathname.startsWith(`${item.href}/`)
          const Icon = item.icon
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? 'page' : undefined}
              className={[
                'flex min-h-14 flex-col items-center justify-center gap-1 text-[12px] font-medium transition-colors',
                active
                  ? 'text-[var(--color-accent-brand)]'
                  : 'text-[var(--color-mute)] hover:text-[var(--color-ink-soft)]',
              ].join(' ')}
            >
              <Icon aria-hidden className="h-5 w-5" strokeWidth={1.8} />
              <span>{item.label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
