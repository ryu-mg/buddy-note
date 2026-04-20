import type { MetadataRoute } from 'next'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:4000'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: ['/', '/b/', '/auth/login'],
        // 비공개/인증/내부 API 는 색인 금지.
        // `/diary/*` 는 소유자 전용 상세 페이지 — 공개 프로필은 `/b/[slug]` 가 전담.
        disallow: [
          '/onboarding',
          '/onboarding/',
          '/log',
          '/log/',
          '/diary/',
          '/auth/callback',
          '/auth/verify',
          '/auth/signout',
          '/api/',
        ],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
  }
}
