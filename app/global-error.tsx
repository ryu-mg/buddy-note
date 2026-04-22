'use client'

import * as Sentry from '@sentry/nextjs'
import { useEffect } from 'react'

type GlobalErrorProps = {
  error: Error & { digest?: string }
  reset: () => void
}

/**
 * global-error.tsx는 root layout 자체가 실패했을 때 렌더된다.
 * 이 경우 globals.css / @theme inline 토큰이 로드됐다는 보장이 없다.
 * 따라서 이 파일은 프로젝트 내에서 유일하게 hex 하드코딩이 허용되는 곳이다.
 * 색상은 DESIGN.md §3 값을 그대로 미러링한다:
 *   - #fafaf5 = --color-paper (폴라로이드 크림, 페이지 배경)
 *   - #1a1a1a = --color-ink   (본문)
 *   - #3f3f3f = --color-ink-soft
 *   - #6b7280 = --color-mute
 *   - #e07a5f = --color-accent-brand (테라코타 primary)
 *   - #ffffff = 카드 배경 / primary text
 * CDN 폰트 (Pretendard / MaruBuri)도 layout이 죽었으면 미로드 상태라
 * system font stack으로 fallback.
 */
export default function GlobalError({ error, reset }: GlobalErrorProps) {
  useEffect(() => {
    // root layout 이 터진 경우라도 Sentry 는 독립 번들이라 포워드 가능.
    if (process.env.NEXT_PUBLIC_SENTRY_DSN) {
      Sentry.captureException(error)
    } else {
      console.error(error)
    }
  }, [error])

  const systemFont =
    "-apple-system, BlinkMacSystemFont, 'Apple SD Gothic Neo', 'Segoe UI', Roboto, sans-serif"

  return (
    <html lang="ko">
      <body
        style={{
          margin: 0,
          minHeight: '100vh',
          backgroundColor: '#fafaf5',
          color: '#1a1a1a',
          fontFamily: systemFont,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '24px',
        }}
      >
        <main
          style={{
            width: '100%',
            maxWidth: '420px',
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '24px',
          }}
        >
          <svg
            viewBox="0 0 180 140"
            aria-label="고개를 갸웃한 버디"
            role="img"
            style={{ width: '150px', height: '116px' }}
          >
            <g transform="rotate(-8 90 72)">
              <path
                d="M44 78c0-31 23-54 53-54s54 23 54 54-24 49-55 49-52-18-52-49Z"
                fill="#fafaf5"
                stroke="#1a1a1a"
                strokeWidth="4"
              />
              <path
                d="M56 38c-10-16-5-30 10-38 9 15 7 29-4 42M128 39c8-15 22-20 37-12-3 17-15 25-32 22"
                fill="#fafaf5"
                stroke="#1a1a1a"
                strokeWidth="4"
                strokeLinecap="round"
              />
              <path d="M80 77h.5M114 77h.5" stroke="#1a1a1a" strokeWidth="7" strokeLinecap="round" />
              <path d="M94 84c4 2 8 2 11 0" stroke="#e07a5f" strokeWidth="4" strokeLinecap="round" />
            </g>
          </svg>
          <h1
            style={{
              margin: 0,
              fontSize: '22px',
              lineHeight: 1.35,
              fontWeight: 600,
              color: '#1a1a1a',
            }}
          >
            앱이 잠시 멈췄어요
          </h1>
          <p
            style={{
              margin: 0,
              fontSize: '14px',
              lineHeight: 1.6,
              color: '#3f3f3f',
              maxWidth: '30ch',
            }}
          >
            내가 잠깐 길을 놓쳤어. 새로고침하면 다시 찾아볼게.
          </p>
          {error.digest && (
            <p
              style={{
                margin: 0,
                fontSize: '12px',
                lineHeight: 1.5,
                color: '#6b7280',
              }}
            >
              참조 코드: {error.digest}
            </p>
          )}
          <button
            type="button"
            onClick={() => {
              try {
                reset()
              } catch {
                if (typeof window !== 'undefined') {
                  window.location.reload()
                }
              }
            }}
            style={{
              appearance: 'none',
              border: 'none',
              cursor: 'pointer',
              backgroundColor: '#e07a5f',
              color: '#ffffff',
              fontFamily: systemFont,
              fontSize: '14px',
              fontWeight: 500,
              padding: '10px 20px',
              borderRadius: '10px',
            }}
          >
            새로고침
          </button>
        </main>
      </body>
    </html>
  )
}
