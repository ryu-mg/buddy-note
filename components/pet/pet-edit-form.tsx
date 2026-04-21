'use client'

import { useRouter } from 'next/navigation'
import { useMemo, useState, useTransition } from 'react'
import { toast } from 'sonner'

import {
  QUESTIONS,
  QUESTION_IDS,
  type Answers,
  type OptionKey,
  type QuestionId,
} from '@/lib/pet-mbti'
import type { PersonaAnswers } from '@/types/database'

import { updatePet } from '@/app/pet/edit/actions'

type PetEditFormProps = {
  pet: {
    id: string
    name: string
    breed: string
    companionRelationship: string
    additionalInfo: string
    persona_answers: PersonaAnswers
  }
}

function toAnswers(input: PersonaAnswers): Partial<Answers> {
  const out: Partial<Answers> = {}
  for (const id of QUESTION_IDS) {
    const v = input[id]
    if (v === 'A' || v === 'B') out[id] = v
  }
  return out
}

/**
 * PetEditForm — 이름/견종/반려인 호칭/4문항을 한 화면에서 수정.
 *
 * 온보딩 스텝퍼와 달리 여기서는 scroll-form UX (모든 질문을 한 번에 본다).
 * 수정은 반복 작업일 가능성이 낮아 단일 페이지가 마찰이 적다.
 */
export function PetEditForm({ pet }: PetEditFormProps) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [name, setName] = useState(pet.name)
  const [breed, setBreed] = useState(pet.breed)
  const [companionRelationship, setCompanionRelationship] = useState(
    pet.companionRelationship,
  )
  const [additionalInfo, setAdditionalInfo] = useState(pet.additionalInfo)
  const [answers, setAnswers] = useState<Partial<Answers>>(() =>
    toAnswers(pet.persona_answers),
  )
  const [error, setError] = useState<string | null>(null)

  const canSubmit = useMemo(() => {
    if (name.trim().length === 0) return false
    if (breed.trim().length === 0) return false
    if (companionRelationship.trim().length === 0) return false
    return QUESTION_IDS.every((id) => Boolean(answers[id]))
  }, [name, breed, companionRelationship, answers])

  function setAnswer(id: QuestionId, v: OptionKey) {
    setAnswers((a) => ({ ...a, [id]: v }))
    setError(null)
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!canSubmit || pending) return

    const fd = new FormData()
    fd.set('name', name.trim())
    fd.set('breed', breed.trim())
    fd.set('companionRelationship', companionRelationship.trim())
    fd.set('additionalInfo', additionalInfo.trim())
    for (const id of QUESTION_IDS) {
      fd.set(id, answers[id] ?? '')
    }

    startTransition(async () => {
      const result = await updatePet(fd)
      if (result.ok) {
        toast.success('업데이트됐어요')
        router.push('/pet')
        router.refresh()
      } else {
        setError(result.error)
        toast.error(result.error)
      }
    })
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-8">
      <fieldset
        disabled={pending}
        className="flex flex-col gap-8 disabled:opacity-70"
      >
        <section
          aria-labelledby="edit-basic-title"
          id="companion"
          className="flex flex-col gap-4 rounded-[var(--radius-card)] border border-[var(--color-line)] bg-[var(--color-bg)] px-5 py-5"
        >
          <div className="flex flex-col gap-0.5">
            <h2
              id="edit-basic-title"
              className="text-[15px] font-semibold text-[var(--color-ink)]"
            >
              기본 정보
            </h2>
            <p className="text-[12px] text-[var(--color-mute)]">
              이름을 바꿔도 공개 URL 은 그대로 유지돼요.
            </p>
          </div>

          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="edit-pet-name"
              className="text-[13px] font-medium text-[var(--color-ink)]"
            >
              이름
            </label>
            <input
              id="edit-pet-name"
              type="text"
              required
              aria-required="true"
              aria-invalid={Boolean(error)}
              aria-describedby={error ? 'pet-edit-error' : undefined}
              autoComplete="nickname"
              maxLength={40}
              value={name}
              onChange={(e) => {
                setName(e.target.value)
                setError(null)
              }}
              placeholder="예) 마루"
              className="w-full rounded-[var(--radius-input)] border border-[var(--color-line)] bg-white px-3 py-2.5 text-[15px] text-[var(--color-ink)] placeholder:text-zinc-400 focus:border-[var(--color-accent-brand)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent-brand)]/30"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="edit-pet-breed"
              className="text-[13px] font-medium text-[var(--color-ink)]"
            >
              견종
            </label>
            <input
              id="edit-pet-breed"
              type="text"
              required
              aria-required="true"
              maxLength={40}
              value={breed}
              onChange={(e) => {
                setBreed(e.target.value)
                setError(null)
              }}
              placeholder="예) 푸들"
              className="w-full rounded-[var(--radius-input)] border border-[var(--color-line)] bg-white px-3 py-2.5 text-[15px] text-[var(--color-ink)] placeholder:text-zinc-400 focus:border-[var(--color-accent-brand)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent-brand)]/30"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="edit-companion-relationship"
              className="text-[13px] font-medium text-[var(--color-ink)]"
            >
              반려인 호칭
            </label>
            <input
              id="edit-companion-relationship"
              type="text"
              required
              aria-required="true"
              maxLength={20}
              value={companionRelationship}
              onChange={(e) => {
                setCompanionRelationship(e.target.value)
                setError(null)
              }}
              placeholder="예) 누나"
              className="w-full rounded-[var(--radius-input)] border border-[var(--color-line)] bg-white px-3 py-2.5 text-[15px] text-[var(--color-ink)] placeholder:text-zinc-400 focus:border-[var(--color-accent-brand)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent-brand)]/30"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="edit-additional-info"
              className="text-[13px] font-medium text-[var(--color-ink)]"
            >
              버디만의 이야기
            </label>
            <textarea
              id="edit-additional-info"
              maxLength={200}
              rows={4}
              value={additionalInfo}
              onChange={(e) => {
                setAdditionalInfo(e.target.value.slice(0, 200))
                setError(null)
              }}
              placeholder="예) 비 오는 날 창밖 보는 걸 좋아해요"
              className="min-h-28 w-full resize-none rounded-[var(--radius-input)] border border-[var(--color-line)] bg-white px-3 py-2.5 text-[15px] leading-[1.55] text-[var(--color-ink)] placeholder:text-zinc-400 focus:border-[var(--color-accent-brand)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent-brand)]/30"
            />
            <p className="text-right text-[12px] tabular-nums text-[var(--color-mute)]">
              {additionalInfo.length}/200
            </p>
          </div>
        </section>

        <section
          aria-labelledby="edit-persona-title"
          id="personality"
          className="flex flex-col gap-4"
        >
          <div className="flex flex-col gap-0.5">
            <h2
              id="edit-persona-title"
              className="text-[15px] font-semibold text-[var(--color-ink)]"
            >
              성격 다시 답하기
            </h2>
            <p className="text-[12px] text-[var(--color-mute)]">
              처음 답한 선택지가 미리 골라져 있어요.
            </p>
          </div>

          <div className="flex flex-col gap-4">
            {QUESTIONS.map((q, i) => (
              <PersonaQuestionRow
                key={q.id}
                index={i + 1}
                total={QUESTIONS.length}
                headline={q.headline}
                prompt={q.prompt}
                options={q.options}
                name={q.id}
                value={answers[q.id] ?? null}
                onChange={(v) => setAnswer(q.id, v)}
              />
            ))}
          </div>
        </section>

        {error ? (
          <p
            id="pet-edit-error"
            role="alert"
            className="rounded-[var(--radius-input)] bg-[var(--color-accent-brand-soft)] px-3 py-2 text-[13px] text-[var(--color-error)]"
          >
            {error}
          </p>
        ) : null}

        <div className="flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => router.push('/pet')}
            disabled={pending}
            className="rounded-[var(--radius-button)] px-4 py-2.5 text-[14px] font-medium text-[var(--color-ink-soft)] transition-opacity hover:opacity-70 disabled:cursor-not-allowed disabled:opacity-30"
          >
            취소
          </button>
          <button
            type="submit"
            disabled={!canSubmit || pending}
            aria-busy={pending}
            className="rounded-[var(--radius-button)] bg-[var(--color-accent-brand)] px-5 py-2.5 text-[14px] font-semibold text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {pending ? '저장하는 중…' : '저장'}
          </button>
        </div>
      </fieldset>
    </form>
  )
}

type PersonaQuestionRowProps = {
  index: number
  total: number
  headline: string
  prompt: string
  options: { key: OptionKey; label: string }[]
  name: string
  value: OptionKey | null
  onChange: (v: OptionKey) => void
}

function PersonaQuestionRow({
  index,
  total,
  headline,
  prompt,
  options,
  name,
  value,
  onChange,
}: PersonaQuestionRowProps) {
  return (
    <article className="rounded-[var(--radius-card)] border border-[var(--color-line)] bg-[var(--color-paper)] px-5 py-5">
      <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-[var(--color-mute)]">
        질문 {index} / {total}
      </p>
      <h3 className="mt-2 text-[16px] font-bold leading-[1.35] text-[var(--color-ink)]">
        {headline}
      </h3>
      <p className="mt-1 text-[13px] text-[var(--color-ink-soft)]">{prompt}</p>

      <fieldset className="mt-4 flex flex-col gap-2">
        <legend className="sr-only">{prompt}</legend>
        {options.map((opt) => {
          const checked = value === opt.key
          return (
            <label
              key={opt.key}
              className={[
                'group/option flex cursor-pointer items-start gap-3 rounded-[var(--radius-button)] border-2 px-4 py-2.5 transition-all duration-200 ease-out motion-reduce:transition-none',
                checked
                  ? 'border-[var(--color-accent-brand)] bg-[var(--color-accent-brand-soft)]'
                  : 'border-transparent bg-white hover:border-[var(--color-line)]',
              ].join(' ')}
            >
              <input
                type="radio"
                name={name}
                value={opt.key}
                checked={checked}
                onChange={() => onChange(opt.key)}
                className="peer sr-only"
              />
              <span
                aria-hidden
                className={[
                  'mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 text-[10px] font-semibold transition-colors',
                  checked
                    ? 'border-[var(--color-accent-brand)] bg-[var(--color-accent-brand)] text-white'
                    : 'border-[var(--color-line)] bg-white text-[var(--color-mute)] group-hover/option:border-[var(--color-ink-soft)]',
                ].join(' ')}
              >
                {opt.key}
              </span>
              <span
                className={[
                  'text-[14px] leading-[1.5]',
                  checked
                    ? 'text-[var(--color-ink)]'
                    : 'text-[var(--color-ink-soft)]',
                ].join(' ')}
              >
                {opt.label}
              </span>
            </label>
          )
        })}
      </fieldset>
    </article>
  )
}
