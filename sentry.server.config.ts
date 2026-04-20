// Sentry server runtime init (Node.js).
//
// DSN 없으면 init 자체를 건너뛰어 dev/local 에서 오버헤드 0.
// 샘플링은 env 로 조절 (기본 0.1). production 에서 트래픽 늘면 낮추기.
//
// PII scrubbing: lib/logger.ts 에서 이미 sanitize 를 거친 context 만 올라오지만,
// 방어 라인 하나 더 — `request.cookies`, `request.headers.authorization`, `user.email` 을 drop.
import * as Sentry from '@sentry/nextjs'

const dsn = process.env.SENTRY_DSN

if (dsn) {
  Sentry.init({
    dsn,
    tracesSampleRate: Number(process.env.SENTRY_TRACES_SAMPLE_RATE ?? '0.1'),
    environment:
      process.env.VERCEL_ENV ?? process.env.NODE_ENV ?? 'development',
    enabled: true,
    // 민감 정보 2차 방어 — logger 에서 이미 redact 했지만 SDK 가 자동 수집하는 필드 추가 차단.
    beforeSend(event) {
      if (event.request) {
        if (event.request.cookies) event.request.cookies = undefined
        if (event.request.headers) {
          const headers = { ...event.request.headers }
          delete headers.authorization
          delete headers.cookie
          event.request.headers = headers
        }
      }
      if (event.user?.email) event.user.email = undefined
      return event
    },
  })
}
