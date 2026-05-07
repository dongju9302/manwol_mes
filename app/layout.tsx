import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Manwol MES",
  description: "이메일과 비밀번호로 로그인하는 게시판 서비스",
  // 파비콘은 app/icon.tsx(ImageResponse)가 자동 처리 — 별도 icons 설정 불필요
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" className="h-full antialiased">
      <head>
        {/* Pretendard 폰트 CDN */}
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard/dist/web/static/pretendard.css"
        />
      </head>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
