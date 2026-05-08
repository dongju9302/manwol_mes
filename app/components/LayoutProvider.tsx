"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import Header, { type HeaderUser } from "./Header";
import Sidebar from "./Sidebar";

// 헤더·사이드바를 미적용하는 경로 목록 (로그인·회원가입·권한없음 페이지)
const AUTH_PATHS = ["/login", "/register", "/unauthorized"];

// 레이아웃 프로바이더 — 클라이언트 컴포넌트
// pathname을 읽어 인증 페이지 여부를 판단하고 레이아웃을 분기
// - 인증 페이지(/login, /register, /unauthorized): children만 렌더링
// - 그 외: Header + Sidebar + main 구조로 감싸서 렌더링
export default function LayoutProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  // /api/auth/me로 조회한 현재 사용자 정보
  const [user, setUser] = useState<HeaderUser | null>(null);

  // 마운트 시 사용자 정보 조회 (루트 레이아웃에 위치하므로 앱 전체에서 1회만 실행)
  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => (r.ok ? r.json() : null))
      .then((data: { user: HeaderUser | null } | null) => {
        if (data?.user) setUser(data.user);
      })
      .catch(() => null);
  }, []);

  // 현재 경로가 인증 페이지에 해당하는지 확인
  const isAuthPage = AUTH_PATHS.some(
    (p) => pathname === p || pathname.startsWith(p + "/")
  );

  // 인증 페이지: 헤더·사이드바 없이 children만 렌더링
  if (isAuthPage) {
    return <>{children}</>;
  }

  // 일반 앱 페이지: 헤더 고정 + 사이드바 + 콘텐츠 레이아웃
  return (
    // 전체 뷰포트를 세로 flex 컨테이너로 구성
    <div className="flex h-screen flex-col">
      {/* 상단 고정 헤더 */}
      <Header user={user} />

      {/* 헤더 아래 나머지 공간: 사이드바 + 메인 콘텐츠 */}
      <div className="flex flex-1 overflow-hidden">
        {/* 좌측 사이드바: 소분류 없으면 null 반환(미표시) */}
        <Sidebar userRole={user?.role ?? "user"} />

        {/* 우측 메인 콘텐츠 영역: 남은 공간 차지, 세로 스크롤 허용 */}
        <main className="flex-1 overflow-auto bg-gray-50">
          {children}
        </main>
      </div>
    </div>
  );
}
