import type { Metadata } from "next";
import "./globals.css";

import { AppHeader } from "@/components/layout/app-header";
import { Toaster } from "@/components/ui/sonner";

// metadataBase: 상대 OG 경로 (예: `/og-image.png`) 를 절대 URL 로 자동 승격.
// 없으면 Kakao/Twitter crawler 가 상대 경로를 해석 못 해 프리뷰 깨짐.
export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:4000',
  ),
  title: "buddy-note",
  description: "반려동물과 쓰는 AI 일기",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
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
      </body>
    </html>
  );
}
