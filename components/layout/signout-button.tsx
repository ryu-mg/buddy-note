/**
 * SignoutButton — 헤더 우측에서 쓰는 얇은 로그아웃 링크.
 *
 * 일반 `<form method="post">` 서브밋으로 동작하므로 JS 없이도 작동하며,
 * 따라서 Server Component로 유지한다 (`'use client'` 없음).
 */
export function SignoutButton() {
  return (
    <form action="/auth/signout" method="post">
      <button
        type="submit"
        className="text-[13px] text-[var(--color-mute)] transition-colors hover:text-[var(--color-ink-soft)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent-brand)] focus-visible:ring-offset-2"
      >
        로그아웃
      </button>
    </form>
  )
}
