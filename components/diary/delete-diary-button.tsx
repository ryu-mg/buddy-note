'use client'

import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { deleteDiary } from '@/app/diary/[id]/actions'

type DeleteDiaryButtonProps = {
  diaryId: string
  petName: string
}

/**
 * 일기 상세에서 "삭제" 진입점.
 *
 * - Confirm dialog 필수 (destructive). type-to-confirm까지는 오버킬 — 단일
 *   일기 단위라 low-stakes.
 * - 성공 시 홈으로 navigate + toast. 실패 시 toast.error만 (dialog는 열어둠).
 * - Primary action 아님 → text-link 톤 버튼.
 */
export function DeleteDiaryButton({ diaryId, petName }: DeleteDiaryButtonProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [pending, startTransition] = useTransition()

  function handleConfirm() {
    startTransition(async () => {
      const result = await deleteDiary(diaryId)
      if (result.ok) {
        toast.success('기록이 삭제됐어요')
        setOpen(false)
        router.push('/')
        router.refresh()
      } else {
        toast.error(result.error)
      }
    })
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        // 처리 중일 때는 닫히지 않도록
        if (pending && !next) return
        setOpen(next)
      }}
    >
      <DialogTrigger asChild>
        <button
          type="button"
          className="self-center text-[13px] text-[var(--color-mute)] underline-offset-4 transition-opacity hover:text-[var(--color-error)] hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-error)] focus-visible:ring-offset-2"
        >
          이 일기 삭제
        </button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>일기를 삭제할까요?</DialogTitle>
          <DialogDescription>
            {petName}의 이 기록이 사라져요. 되돌릴 수 없어요.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="mt-2 flex flex-col gap-2 sm:flex-row sm:justify-end">
          <Button
            type="button"
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={pending}
          >
            취소
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={handleConfirm}
            disabled={pending}
            aria-busy={pending}
          >
            {pending ? '삭제 중…' : '삭제'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
