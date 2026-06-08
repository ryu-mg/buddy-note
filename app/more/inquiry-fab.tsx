'use client'

import { ImageIcon, MessageCircle, Plus, X } from 'lucide-react'
import { useState, useTransition } from 'react'
import { toast } from 'sonner'

import {
  INQUIRY_MENU_ITEMS,
  INQUIRY_TOPIC_OPTIONS,
  inquiryCategoryLabel,
} from '@/lib/support/inquiry'
import type { SupportInquiryCategory } from '@/types/database'

import { submitSupportInquiry } from './actions'

export function InquiryFab() {
  const [menuOpen, setMenuOpen] = useState(false)
  const [category, setCategory] = useState<SupportInquiryCategory | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  const selected = category
    ? INQUIRY_MENU_ITEMS.find((item) => item.category === category)
    : null

  function closeAll() {
    if (pending) return
    setMenuOpen(false)
    setCategory(null)
    setError(null)
  }

  function resetAfterSubmit() {
    setMenuOpen(false)
    setCategory(null)
    setError(null)
  }

  function submit(formData: FormData) {
    if (!category) return
    formData.set('category', category)
    setError(null)
    startTransition(async () => {
      const result = await submitSupportInquiry(formData)
      if (result.ok) {
        toast.success('문의가 남겨졌어요')
        resetAfterSubmit()
        return
      }
      setError(result.error)
      toast.error(result.error)
    })
  }

  return (
    <>
      {menuOpen || selected ? (
        <button
          type="button"
          aria-label="문의 작성 닫기"
          className="fixed inset-0 z-40 bg-[var(--color-ink)]/20"
          onClick={closeAll}
        />
      ) : null}

      {menuOpen && !selected ? (
        <div className="fixed bottom-[calc(var(--bottom-nav-height)+4.75rem)] right-4 z-50 flex w-[min(320px,calc(100vw-2rem))] flex-col gap-2">
          {INQUIRY_MENU_ITEMS.map((item) => (
            <button
              key={item.category}
              type="button"
              onClick={() => {
                setCategory(item.category)
                setMenuOpen(false)
              }}
              className="flex items-start gap-3 rounded-[var(--radius-card)] border border-[var(--color-line)] bg-[var(--color-bg)] px-4 py-3 text-left shadow-[var(--shadow-card-soft)] transition-transform hover:-translate-y-0.5"
            >
              <span className="mt-0.5 inline-flex size-8 items-center justify-center rounded-[var(--radius-button)] bg-[var(--color-accent-brand-soft)] text-[var(--color-accent-brand)]">
                <MessageCircle aria-hidden className="size-4" strokeWidth={1.8} />
              </span>
              <span className="min-w-0">
                <span className="block text-[14px] font-semibold text-[var(--color-ink)]">
                  {item.label}
                </span>
                <span className="mt-1 block text-[12px] leading-[1.45] text-[var(--color-mute)]">
                  {item.description}
                </span>
              </span>
            </button>
          ))}
        </div>
      ) : null}

      {selected ? (
        <section
          role="dialog"
          aria-modal="true"
          aria-labelledby="support-inquiry-title"
          className="fixed inset-x-3 bottom-[calc(var(--bottom-nav-height)+1rem)] z-50 mx-auto max-h-[calc(100dvh-var(--bottom-nav-height)-2rem)] w-auto max-w-md overflow-y-auto rounded-t-[var(--radius-card)] border border-[var(--color-line)] bg-[var(--color-bg)] px-4 pb-5 pt-4 shadow-[var(--shadow-polaroid)]"
        >
          <div className="mb-4 flex items-center justify-between gap-4">
            <div>
              <p className="text-[12px] font-medium uppercase tracking-[0.14em] text-[var(--color-mute)]">
                support
              </p>
              <h2
                id="support-inquiry-title"
                className="mt-1 text-[20px] font-semibold text-[var(--color-ink)]"
              >
                {inquiryCategoryLabel(selected.category)} 남기기
              </h2>
            </div>
            <button
              type="button"
              onClick={closeAll}
              disabled={pending}
              aria-label="문의 작성 닫기"
              className="inline-flex size-9 items-center justify-center rounded-[var(--radius-button)] text-[var(--color-mute)] transition-colors hover:bg-[var(--color-paper)] hover:text-[var(--color-ink)] disabled:opacity-50"
            >
              <X aria-hidden className="size-4" strokeWidth={1.8} />
            </button>
          </div>

          <form action={submit} className="flex flex-col gap-3">
            <label className="flex flex-col gap-1.5">
              <span className="text-[13px] font-semibold text-[var(--color-ink)]">
                카테고리
              </span>
              <select
                name="topic"
                required
                defaultValue=""
                className="min-h-11 rounded-[var(--radius-input)] border border-[var(--color-line)] bg-[var(--color-bg)] px-3 text-[15px] text-[var(--color-ink)] outline-none transition-colors focus:border-[var(--color-accent-brand)]"
              >
                <option value="" disabled>
                  먼저 카테고리를 선택해주세요
                </option>
                {INQUIRY_TOPIC_OPTIONS[selected.category].map((option) => (
                  <option key={option.topic} value={option.topic}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="text-[13px] font-semibold text-[var(--color-ink)]">
                제목
              </span>
              <input
                name="title"
                minLength={2}
                maxLength={80}
                required
                className="min-h-11 rounded-[var(--radius-input)] border border-[var(--color-line)] bg-[var(--color-bg)] px-3 text-[15px] text-[var(--color-ink)] outline-none transition-colors focus:border-[var(--color-accent-brand)]"
                placeholder="무엇을 도와줄까요?"
              />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="text-[13px] font-semibold text-[var(--color-ink)]">
                내용
              </span>
              <textarea
                name="body"
                minLength={10}
                maxLength={1000}
                required
                rows={5}
                className="resize-none rounded-[var(--radius-input)] border border-[var(--color-line)] bg-[var(--color-bg)] px-3 py-3 text-[15px] leading-[1.55] text-[var(--color-ink)] outline-none transition-colors focus:border-[var(--color-accent-brand)]"
                placeholder="상황을 편하게 적어주세요."
              />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="text-[13px] font-semibold text-[var(--color-ink)]">
                이미지 첨부
              </span>
              <span className="flex items-center gap-2 rounded-[var(--radius-input)] border border-dashed border-[var(--color-line)] bg-[var(--color-paper)] px-3 py-3 text-[13px] leading-[1.5] text-[var(--color-mute)]">
                <ImageIcon
                  aria-hidden
                  className="size-4 shrink-0 text-[var(--color-ink-soft)]"
                  strokeWidth={1.8}
                />
                <span>화면 캡처나 참고 이미지를 최대 3장까지 올릴 수 있어요.</span>
              </span>
              <input
                name="attachments"
                type="file"
                accept="image/jpeg,image/png,image/webp"
                multiple
                className="text-[13px] text-[var(--color-mute)] file:mr-3 file:rounded-[var(--radius-button)] file:border-0 file:bg-[var(--color-bg)] file:px-3 file:py-2 file:text-[13px] file:font-semibold file:text-[var(--color-ink-soft)]"
              />
            </label>
            {error ? (
              <p role="alert" className="text-[13px] text-[var(--color-error)]">
                {error}
              </p>
            ) : null}
            <button
              type="submit"
              disabled={pending}
              className="min-h-12 rounded-[var(--radius-button)] bg-[var(--color-accent-cta)] px-5 text-[15px] font-semibold text-[var(--primary-foreground)] shadow-[var(--shadow-accent)] transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              {pending ? '남기는 중...' : '문의 남기기'}
            </button>
          </form>
        </section>
      ) : null}

      {!selected ? (
        <button
          type="button"
          onClick={() => {
            setMenuOpen((open) => !open)
            setCategory(null)
            setError(null)
          }}
          aria-label="문의 메뉴 열기"
          className="fixed bottom-[calc(var(--bottom-nav-height)+1rem)] right-4 z-50 inline-flex size-12 items-center justify-center rounded-full bg-[var(--color-accent-cta)] text-[var(--primary-foreground)] shadow-[var(--shadow-accent)] transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent-brand)] focus-visible:ring-offset-2"
        >
          <Plus aria-hidden className="size-5" strokeWidth={2} />
        </button>
      ) : null}
    </>
  )
}
