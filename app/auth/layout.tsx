import type { ReactNode } from 'react'
import Image from 'next/image'

const FIRST_ROW_DOG_IMAGES = [
  {
    src: '/auth/dogs/dog-watermelon.jpeg',
    alt: '수박 모자를 쓴 하얀 강아지',
  },
  {
    src: '/auth/dogs/dog-puppy-close.jpeg',
    alt: '카메라를 가까이 보는 아기 강아지',
  },
  {
    src: '/auth/dogs/dog-golden.jpeg',
    alt: '잔디 위에서 웃는 골든 리트리버',
  },
  {
    src: '/auth/dogs/dog-smile.jpeg',
    alt: '코를 가까이 대고 웃는 하얀 강아지',
  },
  {
    src: '/auth/dogs/dog-corgi.jpeg',
    alt: '스튜디오에 앉아 있는 코기',
  },
  {
    src: '/auth/dogs/dog-beagle.jpeg',
    alt: '잔디 위에 앉은 비글',
  },
]

const SECOND_ROW_DOG_IMAGES = [
  {
    src: '/auth/dogs/dog-ribbon.jpeg',
    alt: '분홍 리본을 한 하얀 강아지',
  },
  {
    src: '/auth/dogs/dog-sofa-smile.jpeg',
    alt: '소파 위에서 웃는 하얀 강아지',
  },
  {
    src: '/auth/dogs/dog-samoyed-sky.jpeg',
    alt: '파란 하늘 아래 웃는 사모예드',
  },
  {
    src: '/auth/dogs/dog-bowl-puppy.jpeg',
    alt: '밥그릇을 문 아기 강아지',
  },
  {
    src: '/auth/dogs/dog-ladybug.jpeg',
    alt: '코 위에 무당벌레가 앉은 검은 강아지',
  },
  {
    src: '/auth/dogs/dog-sky-happy.jpeg',
    alt: '하늘 아래 안겨 웃는 강아지',
  },
]

type DogImage = (typeof FIRST_ROW_DOG_IMAGES)[number]

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <main className="min-h-screen overflow-hidden bg-[var(--color-bg)] px-4 pb-10 pt-8">
      <div className="mx-auto flex min-h-[calc(100vh-4.5rem)] w-full max-w-md flex-col justify-center">
        <DogPhotoMarquee />

        <div className="mb-6 mt-7 text-center">
          <h1 className="auth-headline-font text-[28px] leading-tight text-[var(--color-ink)]">
            <span className="block">오늘 하루를 남겨줘,</span>
            <span className="block">내가 일기를 써줄게</span>
          </h1>
        </div>

        {children}
      </div>
    </main>
  )
}

function DogPhotoMarquee() {
  return (
    <div
      aria-label="강아지 사진 모음"
      className="relative left-1/2 w-screen -translate-x-1/2 overflow-hidden py-3"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-y-0 left-0 z-10 w-12 bg-gradient-to-r from-[var(--color-bg)] to-transparent"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-y-0 right-0 z-10 w-12 bg-gradient-to-l from-[var(--color-bg)] to-transparent"
      />
      <MarqueeRow direction="left" images={FIRST_ROW_DOG_IMAGES} />
      <MarqueeRow direction="right" images={SECOND_ROW_DOG_IMAGES} />
    </div>
  )
}

function MarqueeRow({
  direction,
  images,
}: {
  direction: 'left' | 'right'
  images: DogImage[]
}) {
  const groups = [0, 1, 2, 3, 4]

  return (
    <div className="auth-dog-marquee mb-3 last:mb-0">
      <div
        className={[
          'flex w-max',
          direction === 'left'
            ? 'auth-dog-marquee-track-left'
            : 'auth-dog-marquee-track-right',
        ].join(' ')}
      >
        {groups.map((group) => (
          <div key={group} className="flex shrink-0 gap-3 pr-3">
            {images.map((image, index) => {
              const itemIndex = group * images.length + index

              return (
                <figure
                  key={`${image.src}-${group}`}
                  className={[
                    'relative h-28 w-24 shrink-0 overflow-hidden border-[6px] border-[var(--color-bg)] bg-[var(--color-paper)] shadow-[var(--shadow-card-soft)]',
                    itemIndex % 3 === 0
                      ? '-rotate-[2deg]'
                      : itemIndex % 3 === 1
                        ? 'rotate-[1.4deg]'
                        : '-rotate-[0.6deg]',
                  ].join(' ')}
                >
                  <Image
                    src={image.src}
                    alt={group === 0 ? image.alt : ''}
                    fill
                    sizes="96px"
                    className="object-cover"
                    priority={group === 0 && index < 3}
                  />
                </figure>
              )
            })}
          </div>
        ))}
      </div>
    </div>
  )
}
