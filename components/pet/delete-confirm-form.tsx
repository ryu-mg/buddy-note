'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'
import { toast } from 'sonner'

import { deleteAccount } from '@/app/pet/delete/actions'

type DeleteConfirmFormProps = {
  /** 사용자가 정확히 타이핑해야 하는 확인 문자열 (대부분 pet.name). */
  confirmTarget: string
  /** 확인 input placeholder 에 쓰일 예시 문구. */
  hint?: string
}

/**
 * 계정 탈퇴 확인 폼.
 *
 * Irreversible action 베스트 프랙티스: "정말 삭제할까요?" 버튼만으로는
 * 부족하므로 펫 이름을 정확히 타이핑해야 버튼이 활성화된다.
 *
 * 성공 시 /auth/login 으로 보내며, sonner 토스트로 완료 안내.
 * 실패 시 code 별로 다른 toast.error.
 */
export function DeleteConfirmForm({
  confirmTarget,
  hint,
}: DeleteConfirmFormProps) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [value, setValue] = useState('')
  const [error, setError] = useState<string | null>(null)

  const matched = value.trim() === confirmTarget.trim()

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!matched || pending) return

    const fd = new FormData()
    fd.set('confirmName', value.trim())

    startTransition(async () => {
      const result = await deleteAccount(fd)
      if (result.ok) {
        toast.success('탈퇴가 완료됐어요')
        // /auth/login 으로 이동 + layout 리프레시.
        router.push('/auth/login')
        router.refresh()
      } else {
        setError(result.error)
        toast.error(result.error)
      }
    })
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <label
          htmlFor="delete-confirm-input"
          className="text-[13px] font-medium text-[var(--color-ink)]"
        >
          확인을 위해{' '}
          <span className="font-semibold text-[var(--color-error)]">
            {confirmTarget}
          </span>{' '}
          를 입력해주세요
        </label>
        <input
          id="delete-confirm-input"
          type="text"
          autoComplete="off"
          autoCapitalize="off"
          autoCorrect="off"
          spellCheck={false}
          required
          aria-required="true"
          aria-invalid={Boolean(error)}
          aria-describedby={error ? 'delete-confirm-error' : undefined}
          value={value}
          onChange={(e) => {
            setValue(e.target.value)
            setError(null)
          }}
          placeholder={hint ?? confirmTarget}
          disabled={pending}
          className="w-full rounded-[var(--radius-input)] border border-[var(--color-line)] bg-[var(--color-bg)] px-3 py-2.5 text-[15px] text-[var(--color-ink)] placeholder:text-[var(--color-mute)]/60 focus:border-[var(--color-error)] focus:outline-none focus:ring-2 focus:ring-[var(--color-error)]/30 disabled:bg-[var(--color-paper)] disabled:opacity-60"
        />
      </div>

      {error ? (
        <p
          id="delete-confirm-error"
          role="alert"
          className="rounded-[var(--radius-input)] bg-[var(--color-accent-brand-soft)] px-3 py-2 text-[13px] text-[var(--color-error)]"
        >
          {error}
        </p>
      ) : null}

      <div className="flex items-center justify-between gap-3 pt-2">
        <Link
          href="/pet"
          className="rounded-[var(--radius-button)] px-4 py-2.5 text-[14px] font-medium text-[var(--color-ink-soft)] transition-opacity hover:opacity-70"
        >
          취소
        </Link>
        <button
          type="submit"
          disabled={!matched || pending}
          aria-busy={pending}
          aria-describedby={!matched ? 'delete-confirm-disabled-reason' : undefined}
          className="rounded-[var(--radius-button)] bg-[var(--color-error)] px-5 py-2.5 text-[14px] font-semibold text-[var(--primary-foreground)] transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {pending ? '탈퇴 처리 중…' : '영구 삭제'}
        </button>
        <span id="delete-confirm-disabled-reason" className="sr-only">
          위 입력란에 {confirmTarget} 를 정확히 입력하면 버튼이 활성화돼요.
        </span>
      </div>
    </form>
  )
}
