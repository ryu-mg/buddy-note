'use client'

import { useEffect, useReducer } from 'react'

type PersonaRevealProps = {
  petName: string
  personalityCode: string
  personalityLabel: string
  answers: Array<{ key: 'A' | 'B' }>
}

// 4문항 대응 회전/이동 값
const FAN_ROTATIONS = [-10, -4, 4, 10]
const FAN_TRANSLATES = [-36, -12, 12, 36]

type Phase = 'fan' | 'name' | 'mbti'

function phaseReducer(state: Phase, action: 'to-name' | 'to-mbti'): Phase {
  if (action === 'to-name') return 'name'
  if (action === 'to-mbti') return 'mbti'
  return state
}

export function PersonaReveal({
  petName,
  personalityCode,
  personalityLabel,
  answers,
}: PersonaRevealProps) {
  const [phase, dispatch] = useReducer(phaseReducer, 'fan')

  useEffect(() => {
    // prefers-reduced-motion 시 타이머 지연 없이 즉시 진행
    const reducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches

    const delay1 = reducedMotion ? 0 : 1500
    const delay2 = reducedMotion ? 0 : 2400

    const t1 = setTimeout(() => dispatch('to-name'), delay1)
    const t2 = setTimeout(() => dispatch('to-mbti'), delay2)
    return () => {
      clearTimeout(t1)
      clearTimeout(t2)
    }
  }, [])

  const showName = phase === 'name' || phase === 'mbti'
  const showMbti = phase === 'mbti'

  return (
    <section
      className="flex flex-col items-center gap-8 py-10"
      aria-live="polite"
      aria-label="반려동물 성격 소개"
    >
      {/* fan-out 폴라로이드 4장 */}
      <div className="relative h-[200px] w-[280px]" aria-hidden>
        {answers.map((ans, i) => (
          <div
            key={i}
            className="absolute left-1/2 top-1/2 h-28 w-20 bg-[var(--color-paper)] p-2 pb-6 shadow-[var(--shadow-polaroid)] ring-1 ring-[var(--color-line)]"
            style={{
              transform: `translate(calc(-50% + ${FAN_TRANSLATES[i]}px), -50%) rotate(${FAN_ROTATIONS[i]}deg)`,
              animation: `polaroid-drop 700ms var(--ease-soft-out) ${i * 120}ms backwards`,
              zIndex: i,
            }}
          >
            <div className="h-full w-full bg-[var(--color-line)]/60 flex items-center justify-center">
              <span className="font-serif text-[22px] font-bold text-[var(--color-accent-brand)]">
                {ans.key}
              </span>
            </div>
            {/* 폴라로이드 하단 caption strip */}
            <span className="absolute bottom-0 left-0 right-0 h-5 bg-[var(--color-paper)] border-t border-[var(--color-line)]" />
          </div>
        ))}
      </div>

      {/* 강아지 이름 reveal */}
      {showName && (
        <h1
          className="font-serif text-[var(--text-display-md)] font-semibold text-[var(--color-ink)] leading-none"
          style={{ animation: 'soft-fade 400ms var(--ease-soft-out) forwards' }}
        >
          {petName}
        </h1>
      )}

      {/* MBTI 코드 + 라벨 */}
      {showMbti && (
        <div
          className="flex flex-col items-center gap-1"
          style={{ animation: 'soft-fade 400ms var(--ease-soft-out) forwards' }}
        >
          <p className="font-serif text-[24px] font-semibold text-[var(--color-accent-brand)]">
            {personalityCode}
          </p>
          <p className="text-[14px] text-[var(--color-ink-soft)]">
            {personalityLabel}
          </p>
        </div>
      )}
    </section>
  )
}
