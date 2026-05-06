'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useTransition } from 'react'
import { Bone, CalendarDays, Home, UserRound } from 'lucide-react'

import { PawPrint } from '@/components/icons/paw-print'

const HIDDEN_PREFIXES = ['/auth', '/onboarding', '/m/']

export function BottomNav() {
  const pathname = usePathname()
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  if (HIDDEN_PREFIXES.some((prefix) => pathname.startsWith(prefix))) {
    return null
  }

  const items = [
    { href: '/week', label: '주간', icon: CalendarDays },
    { href: '/', label: '홈', icon: Home },
    { href: '/pet', label: '내 정보', icon: UserRound },
  ]

  return (
    <nav
      aria-label="주요 메뉴"
      className="fixed inset-x-0 bottom-0 z-40 h-[var(--bottom-nav-height)] border-t border-[var(--color-line)] bg-[var(--color-bg)]"
    >
      <div className="mx-auto grid h-full max-w-md grid-cols-3 px-4 pb-[env(safe-area-inset-bottom)]">
        {items.map((item) => {
          const active =
            item.href === '/'
              ? pathname === '/' || pathname === '/month'
              : pathname === item.href || pathname.startsWith(`${item.href}/`)
          const Icon = item.icon
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={(event) => {
                if (item.href === pathname) return
                if (
                  event.metaKey ||
                  event.ctrlKey ||
                  event.shiftKey ||
                  event.altKey
                ) {
                  return
                }

                event.preventDefault()
                startTransition(() => {
                  router.push(item.href)
                })
              }}
              aria-current={active ? 'page' : undefined}
              className={[
                'flex min-h-[var(--bottom-nav-content-height)] flex-col items-center justify-center gap-1 text-[12px] font-medium transition-colors',
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
      {isPending ? <NavLoadingOverlay /> : null}
    </nav>
  )
}

function NavLoadingOverlay() {
  return (
    <div
      role="status"
      aria-label="화면을 불러오는 중"
      className="fixed inset-0 z-50 flex items-center justify-center bg-[var(--color-bg)]/70 backdrop-blur-[2px]"
    >
      <div className="relative flex h-16 w-16 items-center justify-center rounded-[var(--radius-card)] border border-[var(--color-line)] bg-[var(--color-bg)] shadow-[var(--shadow-card-soft)]">
        <span className="nav-loader-icon absolute text-[var(--color-accent-brand)]">
          <PawPrint className="h-8 w-8" title="강아지 발바닥" />
        </span>
        <span className="nav-loader-icon absolute text-[var(--color-accent-brand)]">
          <PoopIcon className="h-8 w-8" />
        </span>
        <span className="nav-loader-icon absolute text-[var(--color-accent-brand)]">
          <Bone aria-hidden className="h-8 w-8" strokeWidth={1.8} />
        </span>
        <span className="nav-loader-icon absolute text-[var(--color-accent-brand)]">
          <BallIcon className="h-8 w-8" />
        </span>
      </div>
      <span className="sr-only">화면을 불러오고 있어요.</span>
    </div>
  )
}

function PoopIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      role="img"
      aria-label="강아지 배변"
      className={className}
    >
      <path
        d="M12.2 3.2c2.1 1 2.8 2.3 2.2 3.8 2.6.4 4.2 1.9 4.2 4 0 .9-.3 1.7-.8 2.3 1.3.6 2.1 1.7 2.1 3.2 0 2.5-2.4 4.3-7.8 4.3s-7.8-1.8-7.8-4.3c0-1.5.8-2.6 2.1-3.2-.5-.6-.8-1.4-.8-2.3 0-2.2 1.8-3.8 4.6-4 .1-1.3.8-2.5 2-3.8Z"
        fill="currentColor"
      />
      <path
        d="M8.5 14.6c.4.5 1.6 1.1 3.5 1.1s3.1-.6 3.5-1.1"
        fill="none"
        stroke="var(--color-bg)"
        strokeLinecap="round"
        strokeWidth="1.5"
      />
    </svg>
  )
}

function BallIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" role="img" aria-label="공" className={className}>
      <circle cx="12" cy="12" r="8.5" fill="currentColor" />
      <path
        d="M5.8 9.2c3.4 1 7.4 1 12.4 0M8.3 18.1c1.3-4.4 1.3-8.4 0-12.2M15.7 18.1c-1.3-4.4-1.3-8.4 0-12.2"
        fill="none"
        stroke="var(--color-bg)"
        strokeLinecap="round"
        strokeWidth="1.4"
      />
    </svg>
  )
}
