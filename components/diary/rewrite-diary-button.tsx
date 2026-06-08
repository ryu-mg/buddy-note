'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { RefreshCcw } from 'lucide-react'
import { useState, useTransition } from 'react'
import { toast } from 'sonner'

import { rewriteDiary } from '@/app/diary/[id]/actions'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { cn } from '@/lib/utils'

type RewriteDiaryButtonProps = {
  diaryId: string
  canRewrite: boolean
  returnTo?: string
  fullWidth?: boolean
}

export function RewriteDiaryButton({
  diaryId,
  canRewrite,
  returnTo = '/',
  fullWidth = false,
}: RewriteDiaryButtonProps) {
  const router = useRouter()
  const [membershipOpen, setMembershipOpen] = useState(false)
  const [pending, startTransition] = useTransition()
  const membershipHref = `/membership?returnTo=${encodeURIComponent(returnTo)}`

  const handleClick = () => {
    if (!canRewrite) {
      setMembershipOpen(true)
      return
    }

    startTransition(async () => {
      const result = await rewriteDiary(diaryId)
      if (result.ok) {
        toast.success('버디가 일기를 다시 써줬어요')
        router.refresh()
        return
      }
      if (result.code === 'entitlement') {
        setMembershipOpen(true)
        return
      }
      toast.error(result.error)
    })
  }

  return (
    <Dialog open={membershipOpen} onOpenChange={setMembershipOpen}>
      <button
        type="button"
        disabled={pending}
        onClick={handleClick}
        className={cn(
          'inline-flex min-h-11 items-center justify-center gap-2 rounded-[var(--radius-button)] border border-[var(--color-line)] px-4 text-[13px] font-semibold text-[var(--color-ink-soft)] transition-colors hover:bg-[var(--color-paper)] disabled:cursor-not-allowed disabled:opacity-50',
          fullWidth && 'w-full',
        )}
      >
        <RefreshCcw aria-hidden className="size-4" strokeWidth={1.8} />
        {pending ? '다시 쓰는 중...' : '일기 다시 쓰기'}
      </button>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>멤버십에서 다시 쓸 수 있어요</DialogTitle>
          <DialogDescription>
            버디가 같은 하루를 다른 말투로 한 번 더 남겨줘요. 글꼴과
            테마도 함께 바꿀 수 있어요.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-2">
          <Link
            href={membershipHref}
            className="inline-flex min-h-12 items-center justify-center rounded-[var(--radius-button)] bg-[var(--color-accent-cta)] px-5 text-[15px] font-semibold text-[var(--primary-foreground)] shadow-[var(--shadow-accent)] transition-opacity hover:opacity-90"
          >
            멤버십 혜택 보러가기
          </Link>
          <DialogClose asChild>
            <button
              type="button"
              className="inline-flex min-h-11 items-center justify-center rounded-[var(--radius-button)] px-5 text-[14px] font-semibold text-[var(--color-ink-soft)] transition-colors hover:bg-[var(--color-paper)]"
            >
              닫기
            </button>
          </DialogClose>
        </div>
      </DialogContent>
    </Dialog>
  )
}
