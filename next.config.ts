import type { NextConfig } from 'next'
import { withSentryConfig } from '@sentry/nextjs'

const nextConfig: NextConfig = {
  serverExternalPackages: ['@resvg/resvg-js', 'sharp'],
  images: {
    // Supabase Storage:
    // - photos bucket: private, signed URL (query string token) — `/storage/v1/object/sign/**`
    // - diary-images bucket: public — `/storage/v1/object/public/**`
    // 한 host 패턴으로 둘 다 커버. production에서는 hostname을 구체 project ref로 좁히는 걸 권장.
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.supabase.co',
        pathname: '/storage/v1/object/**',
      },
    ],
  },
}

// Sentry 빌드 통합.
// - SENTRY_ORG / SENTRY_PROJECT / SENTRY_AUTH_TOKEN 이 모두 세팅되어야 source map 업로드가 실제로 돈다.
// - 세 env 중 하나라도 빠지면 withSentryConfig 는 silent 로 source map 단계를 건너뛰고,
//   runtime 쪽 Sentry.init 은 DSN 기반으로 독립 작동 — 빌드가 깨지진 않는다.
// - tunnelRoute 는 광고 차단기가 sentry.io 요청을 막는 케이스 대응 (same-origin 프록시).
// - Next 16 은 Turbopack 이 기본이라 webpack.* 옵션은 실질 no-op 이지만,
//   사용자가 `next build --webpack` 으로 떨어뜨릴 때 대비해 그대로 켜둔다.
export default withSentryConfig(nextConfig, {
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  silent: !process.env.CI,
  widenClientFileUpload: true,
  tunnelRoute: '/monitoring',
  webpack: {
    treeshake: {
      removeDebugLogging: true,
    },
    automaticVercelMonitors: true,
  },
})
