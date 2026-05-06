export type FirstEntryTutorialVisibilityInput = {
  hasUser: boolean
  hasPet: boolean
  pathname: string
  completedAt: string | null
  dismissedAt: string | null
}

export function shouldShowFirstEntryTutorial({
  hasUser,
  hasPet,
  pathname,
  completedAt,
  dismissedAt,
}: FirstEntryTutorialVisibilityInput): boolean {
  if (!hasUser) return false
  if (!hasPet) return false
  if (pathname !== '/') return false
  if (completedAt) return false
  if (dismissedAt) return false
  return true
}
