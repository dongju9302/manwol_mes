"use client";

import { useState, useEffect, useCallback } from "react";
import { usePathname, useRouter } from "next/navigation";
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
  const router = useRouter();

  // /api/auth/me로 조회한 현재 사용자 정보
  const [user, setUser] = useState<HeaderUser | null>(null);

  // pathname 변경마다 사용자 정보 재조회
  // [] → [pathname]: 회원가입·로그인 직후 router.push로 이동해도 즉시 갱신
  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => (r.ok ? r.json() : null))
      .then((data: { user: HeaderUser | null } | null) => {
        // 로그인 상태면 user 설정, 비로그인이면 null로 초기화
        setUser(data?.user ?? null);
      })
      .catch(() => setUser(null));
  }, [pathname]);

  // 로그아웃 핸들러: Header에서 API 호출 성공 후 이 함수가 실행됨
  // setUser(null)로 헤더 사용자 정보 즉시 초기화 후 /login 이동
  const handleLogout = useCallback(() => {
    setUser(null);
    router.replace("/login");
  }, [router]);

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
      <Header user={user} onLogout={handleLogout} />

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
