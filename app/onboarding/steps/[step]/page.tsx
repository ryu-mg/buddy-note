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

import { withJosa } from '@/lib/korean-josa'
import {
  buildPersonaPromptFragment,
  calculatePersonality,
  CHARACTER_TRAITS,
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
import { FreeDescriptionForm } from '@/components/onboarding/free-description-form'
import { RelationshipForm } from '@/components/onboarding/relationship-form'
import {
  clearDraft,
  readDraft,
  saveDraft,
} from '@/components/onboarding/onboarding-storage'
import { savePet, type SavePetState } from '../../actions'

const TOTAL_STEPS = 8 // 0 (정보) + 1 (관계) + 4 (질문) + 1 (자유기술) + 1 (확정)

type Draft = {
  info: NameFormValues
  companionRelationship: string
  profilePhotoDataUrl: string
  additionalInfo: string
  answers: Partial<Answers>
}

const emptyDraft: Draft = {
  info: { name: '', breed: '' },
  companionRelationship: '',
  profilePhotoDataUrl: '',
  additionalInfo: '',
  answers: {},
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

  // Hydrate once from localStorage (external system sync).
  // SSR 에서는 localStorage 를 못 읽으므로 mount 뒤 동기화 필수.
  useEffect(() => {
    const stored = readDraft()
    if (stored) {
      /* eslint-disable react-hooks/set-state-in-effect */
      setDraft({
        info: {
          name: stored.name,
          breed: stored.breed,
        },
        companionRelationship: stored.companionRelationship,
        profilePhotoDataUrl: stored.profilePhotoDataUrl ?? '',
        additionalInfo: stored.additionalInfo ?? '',
        answers: stored.answers,
      })
      /* eslint-enable react-hooks/set-state-in-effect */
    }
    setHydrated(true)
  }, [])

  // Persist on every draft change (post-hydration only).
  useEffect(() => {
    if (!hydrated) return
    saveDraft({
      name: draft.info.name,
      breed: draft.info.breed,
      companionRelationship: draft.companionRelationship,
      profilePhotoDataUrl: draft.profilePhotoDataUrl,
      additionalInfo: draft.additionalInfo,
      answers: draft.answers,
      lastStep: step,
    })
  }, [draft, hydrated, step])

  const setInfo = useCallback((next: NameFormValues) => {
    setDraft((d) => ({ ...d, info: next }))
    setStepError(null)
  }, [])

  const setProfilePhotoDataUrl = useCallback((next: string) => {
    setDraft((d) => ({ ...d, profilePhotoDataUrl: next }))
    setStepError(null)
  }, [])

  const setCompanionRelationship = useCallback((next: string) => {
    setDraft((d) => ({ ...d, companionRelationship: next }))
    setStepError(null)
  }, [])

  const setAdditionalInfo = useCallback((next: string) => {
    setDraft((d) => ({ ...d, additionalInfo: next }))
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
      return (
        draft.info.name.trim().length > 0 &&
        draft.info.breed.trim().length > 0
      )
    }
    if (step === 1) {
      return draft.companionRelationship.trim().length > 0
    }
    if (step >= 2 && step <= 5) {
      const id = QUESTION_IDS[step - 2]
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
    if (step === 0 && !draft.info.breed.trim()) {
      setStepError('견종을 적어주세요.')
      return
    }
    if (step === 1 && !draft.companionRelationship.trim()) {
      setStepError('반려인 호칭을 적어주세요.')
      return
    }
    if (step >= 2 && step <= 5) {
      const id = QUESTION_IDS[step - 2]
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

  const handleRetake = useCallback(() => {
    goTo(2)
  }, [goTo])

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
        className="mx-auto mt-10 h-40 w-full max-w-md rounded-[12px] bg-[var(--color-line)]/40"
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
          <NameForm
            value={draft.info}
            profilePhotoDataUrl={draft.profilePhotoDataUrl}
            onChange={setInfo}
            onProfilePhotoChange={setProfilePhotoDataUrl}
            error={stepError}
          />
        ) : step === 1 ? (
          <RelationshipForm
            petName={draft.info.name}
            value={draft.companionRelationship}
            onChange={setCompanionRelationship}
            error={stepError}
          />
        ) : step >= 2 && step <= 5 ? (
          <QuestionCard
            index={step - 1}
            total={4}
            question={QUESTIONS[step - 2]}
            petName={draft.info.name}
            value={draft.answers[QUESTION_IDS[step - 2]] ?? null}
            onChange={(v) => setAnswer(QUESTION_IDS[step - 2], v)}
          />
        ) : step === 6 ? (
          <FreeDescriptionForm
            petName={draft.info.name}
            value={draft.additionalInfo}
            onChange={setAdditionalInfo}
            error={stepError}
          />
        ) : (
          <ConfirmStep draft={draft} />
        )}
        {stepError && step >= 2 && step <= 5 ? (
          <p
            role="alert"
            className="mt-3 text-center text-[13px] text-[var(--color-error)]"
          >
            {stepError}
          </p>
        ) : null}
      </div>

      <StepNav
        step={step}
        total={TOTAL_STEPS}
        canAdvance={canAdvance}
        onPrev={step === TOTAL_STEPS - 1 ? handleRetake : handlePrev}
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
  const ready =
    isCompleteAnswers(draft.answers) &&
    draft.info.name.trim().length > 0 &&
    draft.info.breed.trim().length > 0 &&
    draft.companionRelationship.trim().length > 0
  const fragment = ready
    ? buildPersonaPromptFragment({
        name: draft.info.name,
        breed: draft.info.breed,
        companionRelationship: draft.companionRelationship,
        answers: draft.answers as Answers,
        additionalInfo: draft.additionalInfo,
      })
    : ''
  const personality = ready
    ? calculatePersonality(draft.answers as Answers)
    : null

  return (
    <section
      aria-labelledby="confirm-title"
      className="mx-auto w-full max-w-md"
    >
      <article className="rounded-[var(--radius-card)] border border-[var(--color-line)] bg-[var(--color-paper)] px-6 py-7 shadow-[var(--shadow-card-soft)] motion-safe:[transform:rotate(-0.4deg)] motion-reduce:rotate-0">
        <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-[var(--color-mute)]">
          소개 확인
        </p>
        <h1
          id="confirm-title"
          className="mt-3 text-[21px] font-bold leading-[1.35] text-[var(--color-ink)]"
        >
          이제 {draft.info.name || '버디'}답게 적어볼게요
        </h1>
        <p className="mt-1.5 text-[14px] text-[var(--color-ink-soft)]">
          내용이 맞으면 저장해주세요. 다음 버디노트부터 이 성격을 기억할게요.
        </p>

        {ready ? (
          <>
            <div className="mt-6 flex flex-col items-center text-center">
              <div className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-full border border-[var(--color-line)] bg-[var(--color-bg)] shadow-[var(--shadow-card)]">
                {draft.profilePhotoDataUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={draft.profilePhotoDataUrl}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <span className="text-[38px] font-serif text-[var(--color-accent-brand)]">
                    {draft.info.name.trim().slice(0, 1)}
                  </span>
                )}
              </div>
              <p className="mt-5 text-[15px] font-medium text-[var(--color-mute)]">
                {withJosa(draft.info.name, '은/는')}
              </p>
              <p className="mt-1 font-serif text-[54px] font-semibold leading-none text-[var(--color-ink)]">
                {personality?.code}
              </p>
              <p className="mt-2 text-[18px] font-semibold text-[var(--color-accent-brand)]">
                {personality?.label}
              </p>
            </div>
            {personality ? (
              <ul className="mt-5 grid gap-2">
                {CHARACTER_TRAITS[personality.code].map((trait) => (
                  <li
                    key={trait}
                    className="rounded-[var(--radius-button)] bg-[var(--color-bg)]/70 px-4 py-2.5 text-[14px] leading-[1.45] text-[var(--color-ink-soft)]"
                  >
                    {trait}
                  </li>
                ))}
              </ul>
            ) : null}
            {draft.additionalInfo.trim() ? (
              <blockquote className="mt-4 border-l-2 border-[var(--color-accent-brand)] bg-[var(--color-bg)]/60 px-4 py-3 text-[14px] leading-[1.7] text-[var(--color-ink)]">
                {draft.additionalInfo.trim()}
              </blockquote>
            ) : null}
            <details className="mt-4 rounded-[var(--radius-button)] bg-[var(--color-bg)]/55 px-4 py-3 text-[13px] text-[var(--color-mute)]">
              <summary className="cursor-pointer font-medium text-[var(--color-ink-soft)]">
                프롬프트 조각 보기
              </summary>
              <p className="mt-3 whitespace-pre-wrap leading-[1.65]">{fragment}</p>
            </details>
          </>
        ) : (
          <p className="mt-5 rounded-[8px] bg-[var(--color-accent-brand-soft)] px-3 py-2 text-[13px] text-[var(--color-error)]">
            앞 단계에서 이름, 견종, 반려인 호칭, 4문항을 마저 채워주세요.
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
        className="rounded-[10px] px-4 py-2.5 text-sm font-medium text-[var(--color-ink-soft)] transition-opacity hover:opacity-70 disabled:cursor-not-allowed disabled:opacity-30"
      >
        이전
      </button>
      <button
        type="button"
        onClick={onNext}
        disabled={!canAdvance}
        className="rounded-[var(--radius-button)] bg-[var(--color-accent-brand)] px-5 py-2.5 text-sm font-semibold text-[var(--primary-foreground)] shadow-[var(--shadow-accent)] transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:bg-[var(--color-line)] disabled:text-[var(--color-mute)] disabled:shadow-none"
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
    isCompleteAnswers(draft.answers) &&
    draft.info.name.trim().length > 0 &&
    draft.info.breed.trim().length > 0 &&
    draft.companionRelationship.trim().length > 0

  // 저장 성공 시 서버에서 redirect('/') — 클라는 localStorage 정리만.
  // redirect 후 이 컴포넌트는 언마운트되므로 useEffect cleanup 이 처리.
  // (error 가 오면 언마운트되지 않아 draft 가 그대로 살아있다 → 재시도 가능.)
  useEffect(() => {
    return () => {
      clearDraft()
    }
  }, [])

  return (
    <form action={formAction} className="flex flex-col gap-3">
      <input type="hidden" name="name" value={draft.info.name} />
      <input type="hidden" name="breed" value={draft.info.breed} />
      <input
        type="hidden"
      name="companionRelationship"
      value={draft.companionRelationship}
      />
      <input type="hidden" name="additionalInfo" value={draft.additionalInfo} />
      <input
        type="hidden"
        name="profilePhotoDataUrl"
        value={draft.profilePhotoDataUrl}
      />
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
          className="rounded-[8px] bg-[var(--color-accent-brand-soft)] px-3 py-2 text-[13px] text-[var(--color-error)]"
        >
          {state.error}
        </p>
      ) : null}

      <div className="flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={onPrev}
          disabled={pending}
          className="rounded-[10px] px-4 py-2.5 text-sm font-medium text-[var(--color-ink-soft)] transition-opacity hover:opacity-70 disabled:cursor-not-allowed disabled:opacity-30"
        >
          다시 답할래요
        </button>
        <button
          type="submit"
          disabled={!ready || pending}
          aria-busy={pending}
          className="rounded-[var(--radius-button)] bg-[var(--color-accent-brand)] px-5 py-2.5 text-sm font-semibold text-[var(--primary-foreground)] shadow-[var(--shadow-accent)] transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:bg-[var(--color-line)] disabled:text-[var(--color-mute)] disabled:shadow-none"
        >
          {pending ? '저장하는 중…' : '저장할게요'}
        </button>
      </div>
    </form>
  )
}
