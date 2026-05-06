'use client'

import { useEffect, useRef, useState } from 'react'

type Phase = 'shutter' | 'drop' | 'name' | 'hold' | 'exit'

type ShutterRevealProps = {
  title: string
  petName: string
  imageUrl?: string | null
  className?: string
  onComplete?: () => void
}

export function ShutterReveal({
  title,
  petName,
  imageUrl,
  className = '',
  onComplete,
}: ShutterRevealProps) {
  const [phase, setPhase] = useState<Phase>('shutter')
  const [exiting, setExiting] = useState(false)
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([])

  useEffect(() => {
    // prefers-reduced-motion: 모든 단계 생략, 이름만 즉시 표시 후 1500ms 뒤 이동
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    function schedule(fn: () => void, ms: number) {
      const id = setTimeout(fn, ms)
      timersRef.current.push(id)
      return id
    }

    if (reduced) {
      schedule(() => setPhase('name'), 0)
      schedule(() => {
        setExiting(true)
        schedule(() => onComplete?.(), 300)
      }, 1500)
      return
    }

    // 정상 시퀀스 (총 2800ms)
    // 0ms    : shutter (이미 초기 state)
    // 400ms  : drop
    // 1600ms : name
    // 2000ms : hold (name 유지)
    // 2500ms : exit 시작 (fade out)
    // 2800ms : onComplete 콜백

    schedule(() => setPhase('drop'), 400)
    schedule(() => setPhase('name'), 1600)
    schedule(() => setPhase('hold'), 2000)
    schedule(() => {
      setPhase('exit')
      setExiting(true)
    }, 2500)
    schedule(() => onComplete?.(), 2800)

    return () => {
      for (const id of timersRef.current) clearTimeout(id)
      timersRef.current = []
    }
  }, [onComplete])

  return (
    <div
      role="status"
      aria-live="polite"
      aria-label="일기가 저장됐어"
      className={[
        'fixed inset-0 z-50 flex items-center justify-center bg-[var(--color-bg)]/94 px-6 backdrop-blur-sm',
        'transition-opacity duration-300',
        exiting ? 'opacity-0' : 'opacity-100',
        className,
      ].join(' ')}
    >
      {/* shutter flash — 0~0.5s */}
      {phase === 'shutter' ? (
        <div className="absolute inset-0 motion-safe:animate-[shutter-flash_500ms_ease-out_both] motion-reduce:hidden" />
      ) : null}

      <article className="relative flex w-full max-w-[260px] flex-col items-center">
        {/* polaroid card — drop in at 0.4~1.4s */}
        <div
          className={[
            phase === 'drop' || phase === 'name' || phase === 'hold' || phase === 'exit'
              ? 'motion-safe:animate-[diary-straight-drop_1000ms_cubic-bezier(0.2,0.9,0.25,1)_both] motion-reduce:animate-[soft-fade_600ms_ease-out_both]'
              : 'opacity-0',
          ].join(' ')}
        >
          <div className="border-[14px] border-[var(--color-bg)] border-b-[38px] bg-[var(--color-paper)] shadow-[var(--shadow-polaroid)]">
            {imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={imageUrl} alt="" className="aspect-[4/5] w-full object-cover" />
            ) : (
              <div className="aspect-[4/5] w-48 bg-[var(--color-accent-brand-soft)]" />
            )}
          </div>
        </div>

        {/* petName hero reveal — 1.6~2.0s, font-serif display-md */}
        <div
          className={[
            'mt-7 overflow-hidden',
            phase === 'name' || phase === 'hold' || phase === 'exit'
              ? 'motion-safe:animate-[soft-fade_400ms_var(--ease-soft-out)_both] motion-reduce:animate-none'
              : 'opacity-0 pointer-events-none',
          ].join(' ')}
          style={
            phase === 'name' || phase === 'hold' || phase === 'exit'
              ? { animationFillMode: 'forwards' }
              : undefined
          }
        >
          <p
            className="font-serif font-semibold text-[var(--color-ink)]"
            style={{ fontSize: 'var(--text-display-md)' }}
          >
            {petName}
          </p>
        </div>

        {/* diary title — 나타남과 동시 */}
        <p
          className={[
            'mt-1 max-w-[240px] text-center text-[13px] leading-[1.5] text-[var(--color-mute)]',
            phase === 'name' || phase === 'hold' || phase === 'exit'
              ? 'motion-safe:animate-[soft-fade_400ms_var(--ease-soft-out)_both]'
              : 'opacity-0',
          ].join(' ')}
        >
          {title}
        </p>
      </article>
    </div>
  )
}
