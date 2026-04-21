/* eslint-disable @next/next/no-page-custom-font */
import { Analytics } from '@vercel/analytics/next'
import { SpeedInsights } from '@vercel/speed-insights/next'
import type { Metadata, Viewport } from 'next'

import { AppHeader } from '@/components/layout/app-header'
import { Toaster } from '@/components/ui/sonner'

import './globals.css'

// metadataBase: 상대 OG 경로 (예: `/og-image.png`) 를 절대 URL 로 자동 승격.
// 없으면 Kakao/Twitter crawler 가 상대 경로를 해석 못 해 프리뷰 깨짐.
//
// TODO: public/icons/* 는 플레이스홀더 (terracotta 배경 + "b") — 실제 디자인
// 아이콘 확정되면 scripts/generate-placeholder-icons.mjs 와 함께 교체.
export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:4000',
  ),
  title: 'buddy-note',
  description: '반려동물과 쓰는 AI 일기',
  manifest: '/manifest.webmanifest',
  appleWebApp: {
    capable: true,
    title: 'buddy-note',
    statusBarStyle: 'default',
  },
  icons: {
    icon: [
      { url: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: '/icons/apple-touch-icon.png',
  },
}

// Next 14+ 에서 themeColor 는 metadata 가 아닌 viewport export 로 이동.
// DESIGN.md §3 테라코타 accent (`--color-accent-brand`).
export const viewport: Viewport = {
  themeColor: '#e07a5f',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="ko" className="h-full antialiased">
      <head>
        {/* DESIGN §2 — Pretendard Variable (sans, UI) */}
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable.min.css"
        />
        {/* DESIGN §2 — Nanum Myeongjo (serif, diary body) */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Nanum+Myeongjo:wght@400;700&display=swap"
        />
      </head>
      <body className="min-h-full flex flex-col font-sans bg-[var(--color-bg)] text-[var(--color-ink)]">
        <AppHeader />
        <main className="flex-1">{children}</main>
        <Toaster />
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  )
}
