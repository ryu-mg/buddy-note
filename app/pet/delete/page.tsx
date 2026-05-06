import { redirect } from 'next/navigation'

import { DeleteConfirmForm } from '@/components/pet/delete-confirm-form'
import { buildDeleteConfirmationText } from '@/lib/pet/delete-confirmation'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

type PetForDelete = {
  id: string
  name: string
}

/**
 * /pet/delete — 계정 탈퇴 확인 페이지.
 *
 * - 인증 + pet 게이트 (pet 이 없어도 탈퇴 가능 — "탈퇴" 키워드로 fallback).
 * - 경고 카드 + 삭제 대상 목록 + 이름 타이핑 확인 폼.
 */
export default async function PetDeletePage() {
  const supabase = await createClient()
  if (!supabase) redirect('/auth/login')

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: pet } = await supabase
    .from('pets')
    .select('id, name')
    .eq('user_id', user.id)
    .limit(1)
    .maybeSingle<PetForDelete>()

  const petName = pet?.name ?? null
  // pet 이 없으면 "탈퇴" 문구로 확인 (actions.ts 와 동일 약속).
  const confirmTarget = pet
    ? buildDeleteConfirmationText(pet.name)
    : '탈퇴'

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-xl flex-col gap-6 px-4 pb-20 pt-8 sm:px-6 md:pt-10">
      <header className="flex flex-col gap-1">
        <p className="text-[12px] font-medium uppercase tracking-[0.14em] text-[var(--color-error)]">
          계정 탈퇴
        </p>
        <h1 className="text-[24px] font-semibold leading-[1.25] text-[var(--color-ink)]">
          정말 떠나시나요?
        </h1>
        <p className="text-[13px] leading-[1.5] text-[var(--color-mute)]">
          한 번 지워진 기록은 복구할 수 없어요.
        </p>
      </header>

      <section
        aria-labelledby="delete-warn-title"
        className="flex flex-col gap-3 rounded-[var(--radius-card)] border border-[var(--color-error)]/30 bg-[var(--color-accent-brand-soft)] px-5 py-5"
      >
        <h2
          id="delete-warn-title"
          className="text-[15px] font-semibold text-[var(--color-error)]"
        >
          {petName ? `${petName}의 모든 기록이 영구 삭제돼요.` : '계정과 관련된 모든 기록이 영구 삭제돼요.'}
        </h2>
        <p className="text-[13px] leading-[1.6] text-[var(--color-ink-soft)]">
          이 작업은 되돌릴 수 없어요. 아래 항목이 즉시, 영구적으로 사라져요.
        </p>
        <ul className="ml-1 flex flex-col gap-1 text-[13px] text-[var(--color-ink-soft)]">
          <li className="flex items-baseline gap-2">
            <span aria-hidden className="text-[var(--color-error)]">•</span>
            <span>반려동물 프로필</span>
          </li>
          <li className="flex items-baseline gap-2">
            <span aria-hidden className="text-[var(--color-error)]">•</span>
            <span>지금까지 쓴 모든 일기와 사진</span>
          </li>
          <li className="flex items-baseline gap-2">
            <span aria-hidden className="text-[var(--color-error)]">•</span>
            <span>성격 요약 (그동안 쌓인 기억)</span>
          </li>
          <li className="flex items-baseline gap-2">
            <span aria-hidden className="text-[var(--color-error)]">•</span>
            <span>로그인 정보</span>
          </li>
        </ul>
      </section>

      <section
        aria-label="탈퇴 확인"
        className="rounded-[var(--radius-card)] border border-[var(--color-line)] bg-[var(--color-bg)] px-5 py-5"
      >
        <DeleteConfirmForm
          confirmTarget={confirmTarget}
          hint={pet ? `예) ${confirmTarget}` : '"탈퇴" 라고 입력'}
        />
      </section>
    </main>
  )
}
