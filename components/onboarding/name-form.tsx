'use client'

import { useState } from 'react'

export type NameFormValues = {
  name: string
  breed: string
}

type NameFormProps = {
  value: NameFormValues
  profilePhotoDataUrl?: string
  onChange: (next: NameFormValues) => void
  onProfilePhotoChange: (next: string) => void
  /** 서버 혹은 부모에서 내려오는 에러 메시지 (선택) */
  error?: string | null
}

const MAX_PROFILE_PHOTO_BYTES = 8 * 1024 * 1024

export function NameForm({
  value,
  profilePhotoDataUrl,
  onChange,
  onProfilePhotoChange,
  error,
}: NameFormProps) {
  const [photoError, setPhotoError] = useState<string | null>(null)
  const set = <K extends keyof NameFormValues>(key: K, v: NameFormValues[K]) =>
    onChange({ ...value, [key]: v })

  async function handlePhotoChange(file: File | null) {
    setPhotoError(null)
    if (!file) {
      onProfilePhotoChange('')
      return
    }
    if (!file.type.startsWith('image/')) {
      setPhotoError('이미지 파일만 올릴 수 있어요.')
      return
    }
    if (file.size > MAX_PROFILE_PHOTO_BYTES) {
      setPhotoError('대표 사진은 8MB 이하로 올려주세요.')
      return
    }

    try {
      const dataUrl = await fileToSquareJpegDataUrl(file)
      onProfilePhotoChange(dataUrl)
    } catch {
      setPhotoError('사진을 읽지 못했어요. 다른 사진으로 다시 시도해주세요.')
    }
  }

  return (
    <section
      aria-labelledby="step0-title"
      className="mx-auto w-full max-w-md"
    >
      <article className="rounded-[12px] border border-[var(--line,#e5e7eb)] bg-[var(--paper,#fafaf5)] px-6 py-7 shadow-[0_1px_2px_rgba(0,0,0,0.04),0_8px_24px_-12px_rgba(0,0,0,0.08)] motion-safe:[transform:rotate(-0.6deg)] motion-reduce:rotate-0">
        <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-[var(--mute,#6b7280)]">
          시작하기
        </p>
        <h1
          id="step0-title"
          className="mt-3 text-[20px] font-bold leading-[1.35] text-[var(--ink,#1a1a1a)]"
        >
          버디를 소개해주세요
        </h1>

        <div className="mt-6 flex flex-col gap-5">
          <div className="flex flex-col items-center gap-3">
            <div
              aria-label="대표 사진 미리보기"
              className="relative grid size-28 place-items-center overflow-hidden rounded-full border border-[var(--color-line)] bg-white"
            >
              {profilePhotoDataUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={profilePhotoDataUrl}
                  alt=""
                  className="size-full object-cover"
                />
              ) : (
                <RetrieverPlaceholder />
              )}
            </div>
            <label
              htmlFor="pet-profile-photo"
              className="inline-flex min-h-10 cursor-pointer items-center justify-center rounded-[var(--radius-button)] border border-[var(--color-line)] bg-white px-4 text-[13px] font-medium text-[var(--color-ink)] transition-colors hover:bg-[var(--color-bg)]"
            >
              버디 사진 선택하기
            </label>
            <input
              id="pet-profile-photo"
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="sr-only"
              onChange={(e) => void handlePhotoChange(e.target.files?.[0] ?? null)}
            />
            {photoError ? (
              <p
                role="alert"
                className="text-center text-[12px] text-[var(--color-error)]"
              >
                {photoError}
              </p>
            ) : null}
          </div>

          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="pet-name"
              className="text-[13px] font-medium text-[var(--ink,#1a1a1a)]"
            >
              이름
            </label>
            <input
              id="pet-name"
              name="name"
              type="text"
              required
              aria-required="true"
              aria-invalid={Boolean(error)}
              aria-describedby={error ? 'name-form-error' : undefined}
              autoComplete="nickname"
              maxLength={24}
              value={value.name}
              onChange={(e) => set('name', e.target.value)}
              placeholder="예) 마루"
              className="w-full rounded-[8px] border border-[var(--line,#e5e7eb)] bg-white px-3 py-2.5 text-[15px] text-[var(--color-ink-soft)] placeholder:text-[var(--color-mute)]/60 focus:border-[var(--accent,#e07a5f)] focus:outline-none focus:ring-2 focus:ring-[var(--accent,#e07a5f)]/30"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="pet-breed"
              className="text-[13px] font-medium text-[var(--ink,#1a1a1a)]"
            >
              견종
            </label>
            <input
              id="pet-breed"
              name="breed"
              type="text"
              required
              aria-required="true"
              maxLength={40}
              value={value.breed}
              onChange={(e) => set('breed', e.target.value)}
              placeholder="예) 푸들"
              className="w-full rounded-[8px] border border-[var(--line,#e5e7eb)] bg-white px-3 py-2.5 text-[15px] text-[var(--color-ink-soft)] placeholder:text-[var(--color-mute)]/60 focus:border-[var(--accent,#e07a5f)] focus:outline-none focus:ring-2 focus:ring-[var(--accent,#e07a5f)]/30"
            />
          </div>

          {error ? (
            <p
              id="name-form-error"
              role="alert"
              className="rounded-[8px] bg-[var(--accent-soft,#fde6e0)] px-3 py-2 text-[13px] text-[var(--error,#b04a4a)]"
            >
              {error}
            </p>
          ) : null}
        </div>
      </article>
    </section>
  )
}

function RetrieverPlaceholder() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 96 96"
      className="size-20 text-[var(--color-line)]"
      fill="none"
    >
      <path
        d="M21 44c0-16 11-28 27-28s27 12 27 28v10c0 18-11 30-27 30S21 72 21 54V44Z"
        fill="currentColor"
      />
      <path
        d="M23 45c-8-7-11-19-5-25 9 2 16 9 19 18M73 45c8-7 11-19 5-25-9 2-16 9-19 18"
        fill="currentColor"
      />
      <path
        d="M34 54c4 0 7-3 7-7M62 54c-4 0-7-3-7-7"
        stroke="var(--color-bg)"
        strokeWidth="4"
        strokeLinecap="round"
      />
      <path
        d="M48 58c-5 0-9 3-9 8 0 4 4 7 9 7s9-3 9-7c0-5-4-8-9-8Z"
        fill="var(--color-bg)"
      />
      <path
        d="M44 64h8M48 64v5"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
      />
    </svg>
  )
}

function fileToSquareJpegDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const image = new Image()
    const objectUrl = URL.createObjectURL(file)

    image.onload = () => {
      try {
        const side = Math.min(image.naturalWidth, image.naturalHeight)
        if (!side) {
          reject(new Error('empty image'))
          return
        }

        const canvas = document.createElement('canvas')
        canvas.width = 512
        canvas.height = 512
        const ctx = canvas.getContext('2d')
        if (!ctx) {
          reject(new Error('missing canvas context'))
          return
        }

        const sx = (image.naturalWidth - side) / 2
        const sy = (image.naturalHeight - side) / 2
        ctx.drawImage(image, sx, sy, side, side, 0, 0, 512, 512)

        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error('canvas encode failed'))
              return
            }
            const reader = new FileReader()
            reader.onload = () => {
              if (typeof reader.result === 'string') resolve(reader.result)
              else reject(new Error('file reader failed'))
            }
            reader.onerror = () => reject(reader.error ?? new Error('file reader failed'))
            reader.readAsDataURL(blob)
          },
          'image/jpeg',
          0.86,
        )
      } finally {
        URL.revokeObjectURL(objectUrl)
      }
    }

    image.onerror = () => {
      URL.revokeObjectURL(objectUrl)
      reject(new Error('image load failed'))
    }
    image.src = objectUrl
  })
}
