'use client'

import { Copy } from 'lucide-react'
import { toast } from 'sonner'

type ShareLinkProps = {
  slug: string
}

export function ShareLink({ slug }: ShareLinkProps) {
  const path = `/b/${slug}`

  async function handleCopy() {
    try {
      const origin =
        typeof window !== 'undefined' ? window.location.origin : ''
      const fullUrl = `${origin}${path}`
      if (typeof navigator === 'undefined' || !navigator.clipboard) {
        toast.error('링크를 복사할 수 없는 환경이에요.')
        return
      }
      await navigator.clipboard.writeText(fullUrl)
      toast.success('링크를 복사했어요')
    } catch {
      toast.error('복사하지 못했어요. 다시 시도해주세요.')
    }
  }

  return (
    <div className="flex items-center gap-2 rounded-[var(--radius-input)] bg-[var(--color-paper)] px-2.5 py-1.5 ring-1 ring-[var(--color-line)]">
      <code className="select-all truncate text-[12px] font-medium text-[var(--color-ink-soft)]">
        {path}
      </code>
      <button
        type="button"
        onClick={handleCopy}
        aria-label="공유 링크 복사"
        className="inline-flex size-11 shrink-0 items-center justify-center rounded-[6px] text-[var(--color-mute)] transition-colors hover:bg-[var(--color-line)] hover:text-[var(--color-ink)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-accent-brand)]"
      >
        <Copy className="size-3.5" aria-hidden="true" />
      </button>
    </div>
  )
}
