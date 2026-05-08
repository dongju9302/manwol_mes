import type { Metadata } from "next";
import "./globals.css";
import LayoutProvider from "./components/LayoutProvider";

export const metadata: Metadata = {
  title: "Manwol MES",
  description: "만월 제조실행시스템",
};

// 루트 레이아웃 — 서버 컴포넌트
// 모든 페이지에 공통 적용: html·body 래퍼 + Pretendard 폰트 + LayoutProvider
// 헤더·사이드바 표시 여부는 LayoutProvider(클라이언트)가 pathname 기반으로 결정
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
      <body className="h-full">
        {/*
          LayoutProvider: 클라이언트 컴포넌트
          - /login, /register, /unauthorized → children만 렌더링 (헤더/사이드바 없음)
          - 그 외 → Header + Sidebar + main 레이아웃 적용
        */}
        <LayoutProvider>{children}</LayoutProvider>
      </body>
    </html>
  );
}
