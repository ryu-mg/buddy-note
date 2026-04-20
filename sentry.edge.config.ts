// Sentry edge runtime init.
//
// Edge runtime 은 Node API subset — integrations / beforeSend 대부분은 사용 가능하지만
// 최소만 유지 (번들 크기 민감). server config 과 동일하게 DSN 없으면 no-op.
import * as Sentry from '@sentry/nextjs'

const dsn = process.env.SENTRY_DSN

if (dsn) {
  Sentry.init({
    dsn,
    tracesSampleRate: Number(process.env.SENTRY_TRACES_SAMPLE_RATE ?? '0.1'),
    environment:
      process.env.VERCEL_ENV ?? process.env.NODE_ENV ?? 'development',
    enabled: true,
  })
}
