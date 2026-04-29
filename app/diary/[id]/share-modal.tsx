'use client'

import Image from 'next/image'
import { useCallback, useMemo, useState } from 'react'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'

type Format = '9:16' | '4:5' | '1:1'

const FORMATS: Format[] = ['9:16', '4:5', '1:1']

const FORMAT_LABEL: Record<Format, string> = {
  '9:16': '스토리',
  '4:5': '피드',
  '1:1': '정사각',
}

// Tailwind가 런타임 계산 불가 — 명시 매핑.
const ASPECT_CLASS: Record<Format, string> = {
  '9:16': 'aspect-[9/16]',
  '4:5': 'aspect-[4/5]',
  '1:1': 'aspect-square',
}

type StatusKind = 'info' | 'success' | 'error'

type Status = {
  kind: StatusKind
  text: string
} | null

export type ShareModalProps = {
  title: string
  petName: string
  images: Record<Format, string | null>
  publicUrl?: string | null
}

export function ShareModal({
  title,
  petName,
  images,
  publicUrl,
}: ShareModalProps) {
  const [open, setOpen] = useState(false)
  const [format, setFormat] = useState<Format>('4:5')
  const [status, setStatus] = useState<Status>(null)
  const [busy, setBusy] = useState(false)

  const currentUrl = images[format]

  const shareTitle = useMemo(
    () => `${petName}의 기록 — ${title}`,
    [petName, title],
  )

  const clearStatus = useCallback(() => setStatus(null), [])

  const handleDownload = useCallback(async () => {
    if (!currentUrl) return
    setBusy(true)
    setStatus(null)
    try {
      const res = await fetch(currentUrl, { cache: 'no-store' })
      if (!res.ok) throw new Error('fetch failed')
      const blob = await res.blob()
      const objectUrl = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = objectUrl
      a.download = `${petName}-${format.replace(':', 'x')}.png`
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(objectUrl)
      setStatus({ kind: 'success', text: '이미지를 저장했어요.' })
    } catch (err) {
      console.error('[share-modal.download]', err)
      setStatus({
        kind: 'error',
        text: '다운로드에 실패했어요. 잠시 후 다시 시도해주세요.',
      })
    } finally {
      setBusy(false)
    }
  }, [currentUrl, petName, format])

  const handleCopyImage = useCallback(async () => {
    if (!currentUrl) return
    setBusy(true)
    setStatus(null)
    try {
      if (
        typeof navigator === 'undefined' ||
        !('clipboard' in navigator) ||
        typeof window === 'undefined' ||
        typeof window.ClipboardItem === 'undefined'
      ) {
        setStatus({
          kind: 'info',
          text: '이 브라우저는 복사가 안 돼요. 다운로드해서 올려주세요.',
        })
        return
      }
      const res = await fetch(currentUrl, { cache: 'no-store' })
      if (!res.ok) throw new Error('fetch failed')
      const blob = await res.blob()
      // write는 Blob → PNG 강제 (jpeg여도 대부분 브라우저가 image/png 만 허용)
      await navigator.clipboard.write([
        new ClipboardItem({ [blob.type || 'image/png']: blob }),
      ])
      setStatus({ kind: 'success', text: '이미지를 복사했어요.' })
    } catch (err) {
      console.error('[share-modal.copy]', err)
      setStatus({
        kind: 'info',
        text: '복사 대신 다운로드해서 올려주세요.',
      })
    } finally {
      setBusy(false)
    }
  }, [currentUrl])

  const handleShareLink = useCallback(async () => {
    if (!publicUrl) return
    setBusy(true)
    setStatus(null)
    try {
      const absolute =
        typeof window !== 'undefined'
          ? new URL(publicUrl, window.location.origin).toString()
          : publicUrl

      const nav = typeof navigator !== 'undefined' ? navigator : null
      if (nav && typeof nav.share === 'function') {
        await nav.share({ url: absolute, title: shareTitle })
        setStatus({ kind: 'success', text: '공유창을 열었어요.' })
        return
      }
      if (nav && nav.clipboard && typeof nav.clipboard.writeText === 'function') {
        await nav.clipboard.writeText(absolute)
        setStatus({ kind: 'success', text: '링크를 복사했어요.' })
        return
      }
      setStatus({
        kind: 'info',
        text: '이 브라우저에서는 링크 공유가 안 돼요.',
      })
    } catch (err) {
      // user aborted the share sheet — don't surface as an error
      const name = (err as { name?: string } | null)?.name
      if (name === 'AbortError') {
        setBusy(false)
        return
      }
      console.error('[share-modal.share-link]', err)
      setStatus({
        kind: 'error',
        text: '링크 공유에 실패했어요.',
      })
    } finally {
      setBusy(false)
    }
  }, [publicUrl, shareTitle])

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next)
        if (!next) {
          clearStatus()
          setBusy(false)
        }
      }}
    >
      <DialogTrigger asChild>
        <button
          type="button"
          className="w-full rounded-[var(--radius-button)] bg-[var(--color-accent-cta)] px-5 py-3 text-[15px] font-semibold text-[var(--primary-foreground)] shadow-[var(--shadow-accent)] transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40 disabled:shadow-none"
        >
          공유하기
        </button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>이 일기를 공유할게요</DialogTitle>
          <DialogDescription>
            원하는 비율을 골라 저장하거나 붙여넣으면 돼요.
          </DialogDescription>
        </DialogHeader>

        <div
          role="tablist"
          aria-label="공유 이미지 비율"
          className="mt-1 flex items-center gap-1 rounded-[10px] bg-[var(--color-paper)] p-1"
        >
          {FORMATS.map((f) => {
            const active = f === format
            const disabled = images[f] === null
            return (
              <button
                key={f}
                role="tab"
                type="button"
                aria-selected={active}
                aria-controls={`share-preview-${f.replace(':', '-')}`}
                disabled={disabled}
                onClick={() => {
                  setFormat(f)
                  clearStatus()
                }}
                className={
                  'flex-1 rounded-[8px] px-2 py-1.5 text-[13px] font-medium transition-opacity ' +
                  (active
                    ? 'bg-[var(--color-bg)] text-[var(--color-ink)] shadow-[var(--shadow-card-soft)]'
                    : 'text-[var(--color-mute)] hover:text-[var(--color-ink-soft)]') +
                  ' disabled:cursor-not-allowed disabled:opacity-40'
                }
              >
                {f} · {FORMAT_LABEL[f]}
              </button>
            )
          })}
        </div>

        <div
          id={`share-preview-${format.replace(':', '-')}`}
          role="tabpanel"
          className="mx-auto mt-2 w-full max-w-[260px]"
        >
          <div
            className={
              'relative overflow-hidden bg-[var(--color-line)] ring-1 ring-[var(--color-line)] ' +
              ASPECT_CLASS[format]
            }
          >
            {currentUrl ? (
              // Supabase diary-images public URL — next/image로 최적화
              <Image
                src={currentUrl}
                alt={`${petName} 공유 이미지 미리보기 (${format})`}
                fill
                sizes="260px"
                className="object-cover"
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center px-4 text-center text-[12px] leading-[1.5] text-[var(--color-mute)]">
                이 비율의 이미지가 아직 준비되지 않았어요.
              </div>
            )}
          </div>
        </div>

        {status ? (
          <p
            role={status.kind === 'error' ? 'alert' : 'status'}
            aria-live="polite"
            className={
              'mt-1 rounded-[8px] px-3 py-2 text-[13px] leading-[1.5] ' +
              (status.kind === 'error'
                ? 'bg-[var(--color-accent-brand-soft)] text-[var(--color-error)]'
                : status.kind === 'success'
                  ? 'bg-[var(--color-paper)] text-[var(--color-ink-soft)]'
                  : 'bg-[var(--color-paper)] text-[var(--color-ink-soft)]')
            }
          >
            {status.text}
          </p>
        ) : null}

        <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:justify-end">
          <Button
            type="button"
            variant="outline"
            onClick={handleCopyImage}
            disabled={!currentUrl || busy}
            aria-busy={busy}
          >
            복사
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={handleShareLink}
            disabled={!publicUrl || busy}
            aria-busy={busy}
            title={
              publicUrl
                ? undefined
                : '공개 프로필을 켜야 링크를 공유할 수 있어요.'
            }
          >
            링크 공유
          </Button>
          <Button
            type="button"
            onClick={handleDownload}
            disabled={!currentUrl || busy}
            aria-busy={busy}
          >
            다운로드
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
