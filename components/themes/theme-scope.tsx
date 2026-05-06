import type { CSSProperties, ReactNode } from 'react'

import { buildThemeStyle } from '@/lib/themes/style'

type ThemeScopeProps = {
  themeKey: unknown
  className?: string
  as?: 'div' | 'main'
  children: ReactNode
}

export function ThemeScope({
  themeKey,
  className,
  as = 'div',
  children,
}: ThemeScopeProps) {
  const Component = as

  return (
    <Component className={className} style={buildThemeStyle(themeKey) as CSSProperties}>
      {children}
    </Component>
  )
}
