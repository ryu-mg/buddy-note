'use client'

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
 * CDN 폰트 (Pretendard / Nanum Myeongjo)도 layout이 죽었으면 미로드 상태라
 * system font stack으로 fallback.
 */
export default function GlobalError({ error, reset }: GlobalErrorProps) {
  useEffect(() => {
    // TODO: client error → Sentry
    console.error(error)
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
            새로고침하면 다시 작동할 거예요.
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
