'use client'

import {
  useActionState,
  useEffect,
  useMemo,
  useState,
  use,
  useCallback,
} from 'react'
import { useRouter } from 'next/navigation'
import {
  buildPersonaPromptFragment,
  isCompleteAnswers,
  QUESTIONS,
  QUESTION_IDS,
  type Answers,
  type OptionKey,
  type QuestionId,
} from '@/lib/pet-mbti'
import { QuestionCard } from '@/components/onboarding/question-card'
import { Progress } from '@/components/onboarding/progress'
import {
  NameForm,
  type NameFormValues,
} from '@/components/onboarding/name-form'
import { savePet, type SavePetState } from '../../actions'

const TOTAL_STEPS = 7 // 0 (정보) + 5 (질문) + 1 (확정) = 7
const DRAFT_KEY = 'buddy-note:onboarding-draft:v1'

type Draft = {
  info: NameFormValues
  answers: Partial<Answers>
}

const emptyDraft: Draft = {
  info: { name: '', species: 'dog', breed: '' },
  answers: {},
}

function loadDraft(): Draft {
  if (typeof window === 'undefined') return emptyDraft
  try {
    const raw = window.sessionStorage.getItem(DRAFT_KEY)
    if (!raw) return emptyDraft
    const parsed = JSON.parse(raw)
    return {
      info: {
        name: String(parsed?.info?.name ?? ''),
        species: parsed?.info?.species === 'cat' ? 'cat' : 'dog',
        breed: String(parsed?.info?.breed ?? ''),
      },
      answers: sanitizeAnswers(parsed?.answers),
    }
  } catch {
    return emptyDraft
  }
}

function saveDraft(draft: Draft) {
  if (typeof window === 'undefined') return
  try {
    window.sessionStorage.setItem(DRAFT_KEY, JSON.stringify(draft))
  } catch {
    // ignore quota errors
  }
}

function sanitizeAnswers(x: unknown): Partial<Answers> {
  const out: Partial<Answers> = {}
  if (!x || typeof x !== 'object') return out
  for (const id of QUESTION_IDS) {
    const v = (x as Record<string, unknown>)[id]
    if (v === 'A' || v === 'B' || v === 'C' || v === 'D') {
      out[id] = v
    }
  }
  return out
}

function clampStep(n: number): number {
  if (Number.isNaN(n)) return 0
  return Math.min(Math.max(Math.trunc(n), 0), TOTAL_STEPS - 1)
}

type PageProps = {
  params: Promise<{ step: string }>
}

export default function OnboardingStepPage(props: PageProps) {
  const { step: stepParam } = use(props.params)
  const router = useRouter()
  const step = clampStep(Number.parseInt(stepParam ?? '0', 10))

  // Draft state — 로컬 ref 대신 상태로, 각 step 이 re-render 되게.
  const [draft, setDraft] = useState<Draft>(emptyDraft)
  const [hydrated, setHydrated] = useState(false)
  const [stepError, setStepError] = useState<string | null>(null)

  // Hydrate once from sessionStorage (external system sync).
  // SSR 에서는 sessionStorage 를 못 읽으므로 mount 뒤 동기화 필수.
  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect */
    setDraft(loadDraft())
    setHydrated(true)
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [])

  // Persist on every draft change (post-hydration only).
  useEffect(() => {
    if (!hydrated) return
    saveDraft(draft)
  }, [draft, hydrated])

  const setInfo = useCallback((next: NameFormValues) => {
    setDraft((d) => ({ ...d, info: next }))
    setStepError(null)
  }, [])

  const setAnswer = useCallback((id: QuestionId, v: OptionKey) => {
    setDraft((d) => ({ ...d, answers: { ...d.answers, [id]: v } }))
    setStepError(null)
  }, [])

  const goTo = useCallback(
    (n: number) => {
      const target = clampStep(n)
      router.push(`/onboarding/steps/${target}`)
    },
    [router],
  )

  // Validate step 0 before advancing.
  const canAdvance = useMemo(() => {
    if (step === 0) {
      return draft.info.name.trim().length > 0
    }
    if (step >= 1 && step <= 5) {
      const id = QUESTION_IDS[step - 1]
      return Boolean(draft.answers[id])
    }
    // step 6 — advancing means submit, handled by form.
    return true
  }, [step, draft])

  const handleNext = useCallback(() => {
    if (step === 0 && !draft.info.name.trim()) {
      setStepError('이름을 적어주세요.')
      return
    }
    if (step >= 1 && step <= 5) {
      const id = QUESTION_IDS[step - 1]
      if (!draft.answers[id]) {
        setStepError('하나를 골라주세요.')
        return
      }
    }
    goTo(step + 1)
  }, [step, draft, goTo])

  const handlePrev = useCallback(() => {
    if (step === 0) return
    goTo(step - 1)
  }, [step, goTo])

  // Enter 키로 다음 스텝. 최종 step 6 은 form submit 으로 저장.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Enter') return
      const target = e.target as HTMLElement | null
      // Form / 버튼 안에서는 기본 동작 존중.
      if (
        target &&
        (target.tagName === 'BUTTON' ||
          target.tagName === 'TEXTAREA' ||
          (target.tagName === 'INPUT' &&
            (target as HTMLInputElement).type !== 'radio'))
      ) {
        return
      }
      if (step < TOTAL_STEPS - 1) {
        e.preventDefault()
        handleNext()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [step, handleNext])

  // Render placeholder until hydrated to keep draft consistency.
  if (!hydrated) {
    return (
      <div
        aria-hidden
        className="mx-auto mt-10 h-40 w-full max-w-md rounded-[12px] bg-[var(--line,#e5e7eb)]/40"
      />
    )
  }

  return (
    <div className="mx-auto flex w-full max-w-md flex-col gap-6 px-4 pb-12 pt-8">
      <Progress current={step + 1} total={TOTAL_STEPS} />

      <div
        key={step}
        className="motion-safe:animate-[slide-up_300ms_cubic-bezier(0.2,0.9,0.3,1)_both] motion-reduce:animate-none"
      >
        {step === 0 ? (
          <NameForm value={draft.info} onChange={setInfo} error={stepError} />
        ) : step >= 1 && step <= 5 ? (
          <QuestionCard
            index={step}
            total={5}
            question={QUESTIONS[step - 1]}
            value={draft.answers[QUESTION_IDS[step - 1]] ?? null}
            onChange={(v) => setAnswer(QUESTION_IDS[step - 1], v)}
          />
        ) : (
          <ConfirmStep draft={draft} />
        )}
        {stepError && step >= 1 && step <= 5 ? (
          <p
            role="alert"
            className="mt-3 text-center text-[13px] text-[var(--error,#b04a4a)]"
          >
            {stepError}
          </p>
        ) : null}
      </div>

      <StepNav
        step={step}
        total={TOTAL_STEPS}
        canAdvance={canAdvance}
        onPrev={handlePrev}
        onNext={handleNext}
        draft={draft}
      />

      <style jsx>{`
        @keyframes slide-up {
          from {
            opacity: 0;
            transform: translateY(12px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  )
}

function ConfirmStep({ draft }: { draft: Draft }) {
  const ready = isCompleteAnswers(draft.answers) && draft.info.name.trim().length > 0
  const fragment = ready
    ? buildPersonaPromptFragment({
        name: draft.info.name,
        breed: draft.info.breed,
        answers: draft.answers as Answers,
      })
    : ''

  return (
    <section
      aria-labelledby="confirm-title"
      className="mx-auto w-full max-w-md"
    >
      <article className="rounded-[12px] border border-[var(--line,#e5e7eb)] bg-[var(--paper,#fafaf5)] px-6 py-7 shadow-[0_1px_2px_rgba(0,0,0,0.04),0_8px_24px_-12px_rgba(0,0,0,0.08)] motion-safe:[transform:rotate(-0.4deg)] motion-reduce:rotate-0">
        <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-[var(--mute,#6b7280)]">
          소개 미리보기
        </p>
        <h1
          id="confirm-title"
          className="mt-3 text-[20px] font-bold leading-[1.35] text-[var(--ink,#1a1a1a)]"
        >
          이렇게 기록해둘게요
        </h1>
        <p className="mt-1.5 text-[14px] text-[var(--ink-soft,#3f3f3f)]">
          내용이 맞으면 저장해주세요. 나중에 언제든 다시 바꿀 수 있어요.
        </p>

        {ready ? (
          <blockquote
            className="mt-5 whitespace-pre-wrap border-l-2 border-[var(--accent,#e07a5f)] bg-white/60 px-4 py-4 text-[15px] leading-[1.7] text-[var(--ink,#1a1a1a)]"
            style={{ fontFamily: '"Nanum Myeongjo", "RIDIBatang", serif' }}
          >
            {fragment}
          </blockquote>
        ) : (
          <p className="mt-5 rounded-[8px] bg-[var(--accent-soft,#fde6e0)] px-3 py-2 text-[13px] text-[var(--error,#b04a4a)]">
            앞 단계에서 이름과 5문항을 마저 채워주세요.
          </p>
        )}
      </article>
    </section>
  )
}

function StepNav({
  step,
  total,
  canAdvance,
  onPrev,
  onNext,
  draft,
}: {
  step: number
  total: number
  canAdvance: boolean
  onPrev: () => void
  onNext: () => void
  draft: Draft
}) {
  const isLast = step === total - 1

  if (isLast) {
    return <SubmitRow onPrev={onPrev} draft={draft} />
  }

  return (
    <div className="flex items-center justify-between gap-3">
      <button
        type="button"
        onClick={onPrev}
        disabled={step === 0}
        className="rounded-[10px] px-4 py-2.5 text-sm font-medium text-[var(--ink-soft,#3f3f3f)] transition-opacity hover:opacity-70 disabled:cursor-not-allowed disabled:opacity-30"
      >
        이전
      </button>
      <button
        type="button"
        onClick={onNext}
        disabled={!canAdvance}
        className="rounded-[10px] bg-[var(--accent,#e07a5f)] px-5 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
      >
        다음
      </button>
    </div>
  )
}

function SubmitRow({
  onPrev,
  draft,
}: {
  onPrev: () => void
  draft: Draft
}) {
  const initial: SavePetState = {}
  const [state, formAction, pending] = useActionState(savePet, initial)
  const ready =
    isCompleteAnswers(draft.answers) && draft.info.name.trim().length > 0

  // 저장 성공 시 서버에서 redirect('/') — 클라는 sessionStorage 정리만.
  // redirect 후 이 컴포넌트는 언마운트되므로 useEffect cleanup 이 처리.
  useEffect(() => {
    return () => {
      if (typeof window !== 'undefined') {
        try {
          window.sessionStorage.removeItem(DRAFT_KEY)
        } catch {
          /* noop */
        }
      }
    }
  }, [])

  return (
    <form action={formAction} className="flex flex-col gap-3">
      <input type="hidden" name="name" value={draft.info.name} />
      <input type="hidden" name="species" value={draft.info.species} />
      <input type="hidden" name="breed" value={draft.info.breed} />
      {QUESTION_IDS.map((id) => (
        <input
          key={id}
          type="hidden"
          name={id}
          value={draft.answers[id] ?? ''}
        />
      ))}

      {state.error ? (
        <p
          role="alert"
          className="rounded-[8px] bg-[var(--accent-soft,#fde6e0)] px-3 py-2 text-[13px] text-[var(--error,#b04a4a)]"
        >
          {state.error}
        </p>
      ) : null}

      <div className="flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={onPrev}
          disabled={pending}
          className="rounded-[10px] px-4 py-2.5 text-sm font-medium text-[var(--ink-soft,#3f3f3f)] transition-opacity hover:opacity-70 disabled:cursor-not-allowed disabled:opacity-30"
        >
          이전
        </button>
        <button
          type="submit"
          disabled={!ready || pending}
          className="rounded-[10px] bg-[var(--accent,#e07a5f)] px-5 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {pending ? '저장하는 중…' : '저장할게요'}
        </button>
      </div>
    </form>
  )
}
