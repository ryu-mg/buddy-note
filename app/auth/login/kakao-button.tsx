'use client'

import { useTransition } from 'react'
import { toast } from 'sonner'

import { signInWithKakao } from './actions'

export function KakaoButton() {
  const [pending, startTransition] = useTransition()

  function handleClick() {
    startTransition(async () => {
      const result = await signInWithKakao()
      if (!result.ok) {
        toast.error(result.error)
        return
      }
      // OAuth 이동은 라우터 push가 아니라 전체 페이지 전환이어야 함
      // (Supabase가 Kakao authorize로 302 리다이렉트 체인을 태움)
      window.location.href = result.redirectUrl
    })
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={pending}
      aria-busy={pending}
      aria-label="카카오로 계속하기"
      // #FEE500 / #000 는 카카오 브랜드 가이드라인이 강제하는 색상.
      // DESIGN.md 토큰 우선 규칙에 대한 의도적 예외 (Kakao brand exception).
      className="flex w-full items-center justify-center rounded-[10px] bg-[#FEE500] px-4 py-3 text-sm font-semibold text-[#000000] transition-opacity duration-200 hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
    >
      {pending ? '연결하는 중이에요' : '카카오로 계속하기'}
    </button>
  )
}
