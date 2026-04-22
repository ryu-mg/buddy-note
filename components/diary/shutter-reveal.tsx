'use client'

type ShutterRevealProps = {
  title: string
  imageUrl?: string | null
  className?: string
}

export function ShutterReveal({ title, imageUrl, className = '' }: ShutterRevealProps) {
  return (
    <div
      role="status"
      aria-live="polite"
      className={[
        'fixed inset-0 z-50 flex items-center justify-center bg-[var(--color-bg)]/94 px-6 backdrop-blur-sm',
        className,
      ].join(' ')}
    >
      <div className="absolute inset-0 motion-safe:animate-[shutter-flash_1.4s_ease-out_both] motion-reduce:animate-none" />
      <article className="relative flex w-full max-w-[260px] flex-col items-center">
        <div className="motion-safe:animate-[polaroid-drop_1.4s_cubic-bezier(0.2,0.9,0.25,1)_both] motion-reduce:animate-[soft-fade_600ms_ease-out_both]">
          <div className="-rotate-2 border-[14px] border-[var(--color-bg)] border-b-[38px] bg-[var(--color-paper)] shadow-[var(--shadow-polaroid)]">
            {imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={imageUrl} alt="" className="aspect-[4/5] w-full object-cover" />
            ) : (
              <div className="aspect-[4/5] w-48 bg-[var(--color-accent-brand-soft)]" />
            )}
          </div>
        </div>
        <p className="mt-7 font-serif text-[26px] font-semibold text-[var(--color-ink)] motion-safe:animate-[soft-fade_1.4s_ease-out_both]">
          저장됐어
        </p>
        <p className="mt-1 max-w-[240px] text-center text-[13px] leading-[1.5] text-[var(--color-mute)]">
          {title}
        </p>
      </article>
    </div>
  )
}
