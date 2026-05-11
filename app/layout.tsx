import type { Metadata, Viewport } from "next";
import "./globals.css";
import LayoutProvider from "./components/LayoutProvider";

// ── Viewport 설정 ─────────────────────────────────────────────────
// Next.js 16: viewport는 metadata와 분리해서 export
// viewportFit=cover: 모바일 노치/홈바 세이프 에리어 활용 (PC는 무영향)
// maximumScale=5: 접근성 위해 줌 허용 (user-scalable=no 지양)
// themeColor: PWA/모바일 브라우저 상태바 색상
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  viewportFit: "cover",
  themeColor: "#ffffff",
};

// ── Metadata 설정 ─────────────────────────────────────────────────
export const metadata: Metadata = {
  title: "Manwol MES",
  description: "만월 제조실행시스템",
  // PWA manifest 연결
  manifest: "/manifest.json",
  // iOS 홈 화면 추가(A2HS) 설정
  appleWebApp: {
    capable: true,              // 풀스크린 앱 모드 활성화
    statusBarStyle: "default",  // 상태바 스타일 (black-translucent 시 세이프 에리어 주의)
    title: "Manwol",            // 홈 화면 아이콘 레이블
  },
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
