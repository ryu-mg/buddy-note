import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
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
        {children}
      </body>
    </html>
  );
}
