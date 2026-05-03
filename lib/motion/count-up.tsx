'use client'

import { useEffect, useRef, useState } from 'react'

type CountUpProps = {
  to: number
  duration?: number // ms (default 800)
  className?: string
  suffix?: string // 예: "일째"
}

export function CountUp({ to, duration = 800, className, suffix }: CountUpProps) {
  const [value, setValue] = useState(0)
  const startRef = useRef<number | null>(null)
  const rafRef = useRef<number | null>(null)
  const reduced = useRef(false)

  useEffect(() => {
    reduced.current = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduced.current) {
      setValue(to)
      return
    }
    function tick(now: number) {
      if (startRef.current === null) startRef.current = now
      const elapsed = now - startRef.current
      const progress = Math.min(1, elapsed / duration)
      // ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3)
      setValue(Math.round(eased * to))
      if (progress < 1) rafRef.current = requestAnimationFrame(tick)
    }
    rafRef.current = requestAnimationFrame(tick)
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current)
    }
  }, [to, duration])

  return (
    <span className={className}>
      {value}
      {suffix}
    </span>
  )
}
