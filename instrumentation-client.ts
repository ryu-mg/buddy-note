// Next.js 16 / Turbopack 권장 convention — sentry.client.config.ts 대신 이 파일.
// (sentry.client.config.ts 를 쓰면 @sentry/nextjs 가 DEPRECATION 경고를 띄우고
//  Turbopack 에서는 아예 로드되지 않는다.)
//
// DSN 없으면 init 건너뛰므로 dev 에서 번들 영향 없음.
// replaysSessionSampleRate=0 — v1 비용 민감, full session replay 비활성.
// replaysOnErrorSampleRate=0.1 — 에러 발생 세션만 10% 샘플 리플레이.
//   단, replay integration 을 추가하지 않으면 replay 는 생성되지 않는다.
//   v1 에서는 integrations 비워두고 수치만 미리 설정 (나중에 integration 만 추가하면 됨).
import * as Sentry from '@sentry/nextjs'

const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN

if (dsn) {
  Sentry.init({
    dsn,
    tracesSampleRate: Number(
      process.env.NEXT_PUBLIC_SENTRY_TRACES_SAMPLE_RATE ?? '0.1',
    ),
    replaysSessionSampleRate: 0,
    replaysOnErrorSampleRate: 0.1,
    environment:
      process.env.NEXT_PUBLIC_VERCEL_ENV ??
      process.env.NODE_ENV ??
      'development',
    integrations: [],
  })
}

// App Router 네비게이션을 Sentry 트랜잭션에 연결. DSN 없으면 Sentry.init 이 건너뛰어
// 이 hook 도 자동 no-op.
export const onRouterTransitionStart = Sentry.captureRouterTransitionStart
