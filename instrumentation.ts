// Next.js 16 instrumentation hook.
//
// `register` 는 서버 부팅 시 한 번 실행된다. runtime 별 config 을 분리해서
// node 런타임이면 sentry.server.config, edge 런타임이면 sentry.edge.config 를 로드.
//
// `onRequestError` 는 Next 15+ 가 제공하는 훅 — RSC/Route Handler/Server Action 에서
// throw 된 에러를 Sentry 로 포워드한다. DSN 이 없으면 Sentry.init 자체가 no-op 이므로
// 이 export 는 항상 안전하게 두어도 된다.
import * as Sentry from '@sentry/nextjs'

export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    await import('./sentry.server.config')
  }
  if (process.env.NEXT_RUNTIME === 'edge') {
    await import('./sentry.edge.config')
  }
}

export const onRequestError = Sentry.captureRequestError
