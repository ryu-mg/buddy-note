import Image from 'next/image'

type PublicDiaryCardProps = {
  title: string
  body: string
  imageUrl: string | null
  createdAt: string
  petName: string
  wide?: boolean
}

function formatDate(iso: string): string {
  // "2026년 4월 20일" — 한국 로케일
  try {
    const d = new Date(iso)
    const y = d.getFullYear()
    const m = d.getMonth() + 1
    const day = d.getDate()
    return `${y}년 ${m}월 ${day}일`
  } catch {
    return ''
  }
}

/**
 * Public-facing diary polaroid card.
 *
 * 의도:
 * - 익명 viewer는 owner-scoped `/diary/[id]`로 navigate 불가 → **링크 X**.
 * - 사진이 비어 있으면 (LLM/렌더 실패) 로그 사진으로 fallback 하지 않음 — 프라이버시.
 *   `logs.photo_url`은 owner only.
 *
 * DESIGN §12 폴라로이드: -1.2deg 기울임, 24px white border, photo 4:5,
 * MaruBuri 본문, paper bg.
 */
export function PublicDiaryCard({
  title,
  body,
  imageUrl,
  createdAt,
  petName,
  wide = false,
}: PublicDiaryCardProps) {
  const dateLabel = formatDate(createdAt)

  return (
    <article
      aria-labelledby={`pdc-title-${createdAt}`}
      className={[
        'relative mx-auto w-full bg-[var(--color-paper)] px-6 pb-11 pt-6 shadow-[var(--shadow-card)] ring-1 ring-[var(--color-line)] motion-safe:-rotate-[1.2deg] motion-reduce:rotate-0',
        wide ? 'max-w-[640px]' : 'max-w-[420px]',
      ].join(' ')}
    >
      <div className="flex items-baseline justify-between gap-3">
        <p className="text-[12px] font-medium uppercase tracking-[0.12em] text-[var(--color-mute)]">
          {dateLabel}
        </p>
        <p
          className="text-[14px] leading-[1.5] text-[var(--color-ink)]"
          style={{ fontFamily: 'var(--font-serif)' }}
        >
          {petName}
        </p>
      </div>

      {imageUrl ? (
        <div className="mt-4 overflow-hidden bg-[var(--color-line)]">
          {/* wide: 5:4 가로 spread, 일반: 4:5 세로 */}
          <div className={['relative w-full', wide ? 'aspect-[5/4]' : 'aspect-[4/5]'].join(' ')}>
            <Image
              src={imageUrl}
              alt={`${petName}의 일기 사진`}
              fill
              sizes={wide ? '(max-width: 640px) 100vw, 640px' : '(max-width: 640px) 100vw, 420px'}
              className="object-cover"
            />
          </div>
        </div>
      ) : null}

      <h2
        id={`pdc-title-${createdAt}`}
        className="mt-6 text-[20px] font-semibold leading-[1.35] text-[var(--color-ink)]"
      >
        {title}
      </h2>

      <p
        className="mt-3 line-clamp-2 text-[15px] leading-[1.65] text-[var(--color-ink-soft)]"
        style={{ fontFamily: 'var(--font-serif)' }}
      >
        {body}
      </p>
    </article>
  )
}
