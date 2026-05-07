"use client";

import { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";

// 사이드바 메뉴 항목 타입
interface MenuItem {
  // 이동할 경로
  href: string;
  // 표시할 레이블
  label: string;
  // 메뉴 아이콘 (이모지)
  icon: string;
}

// 부모(서버 컴포넌트)에서 전달받는 props 타입
interface SidebarProps {
  // 현재 로그인한 사용자 이름 (하단에 표시)
  userName: string;
}

// 추후 메뉴 추가 시 이 배열에만 항목을 추가하면 됨
const MENU_ITEMS: MenuItem[] = [
  { href: "/board", label: "게시판", icon: "📋" },
];

// 사이드바 — 클라이언트 컴포넌트
// 현재 경로에 따라 활성 메뉴를 하이라이트하고, 하단에 사용자 이름 + 로그아웃 버튼 배치
export default function Sidebar({ userName }: SidebarProps) {
  // 현재 URL 경로 (활성 메뉴 판별에 사용)
  const pathname = usePathname();
  // 로그아웃 후 페이지 이동을 위한 라우터
  const router = useRouter();
  // 로그아웃 요청 중 중복 클릭 방지
  const [isLoggingOut, setIsLoggingOut] = useState<boolean>(false);

  // 로그아웃 핸들러: POST /api/auth/logout → /login으로 이동
  const handleLogout = async (): Promise<void> => {
    setIsLoggingOut(true);
    try {
      // 서버에서 token 쿠키를 삭제
      await fetch("/api/auth/logout", { method: "POST" });
      // replace로 뒤로가기 시 보드 페이지로 돌아오지 않도록 처리
      router.replace("/login");
    } catch {
      // 네트워크 오류가 발생해도 로그인 페이지로 이동
      router.replace("/login");
    }
  };

  return (
    // 모바일(md 미만)에서는 숨김, md 이상에서 flex column으로 표시
    <aside className="hidden md:flex h-full w-60 shrink-0 flex-col border-r border-gray-200 bg-white">
      {/* 상단: 서비스 제목 */}
      <div className="flex flex-col items-center border-b border-gray-100 px-5 py-5">
        <p className="text-xl font-bold tracking-wide text-gray-800">
          Manwol <span className="font-semibold text-gray-400">MES</span>
        </p>
      </div>

      {/* 중단: 내비게이션 메뉴 */}
      <nav className="flex-1 overflow-y-auto px-3 py-4">
        <ul className="space-y-1">
          {MENU_ITEMS.map((item) => {
            // 현재 경로가 해당 메뉴 경로와 일치하거나 하위 경로인 경우 활성화
            const isActive =
              pathname === item.href ||
              pathname.startsWith(item.href + "/");

            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors
                    ${
                      isActive
                        ? "bg-blue-50 text-blue-600"
                        : "text-gray-600 hover:bg-gray-100 hover:text-gray-800"
                    }`}
                >
                  {/* 메뉴 아이콘 */}
                  <span className="text-base">{item.icon}</span>
                  {/* 메뉴 레이블 */}
                  <span>{item.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* 하단: 로그인한 사용자 이름 + 로그아웃 버튼 */}
      <div className="border-t border-gray-100 px-4 py-4">
        {/* 사용자 정보 */}
        <div className="mb-3 px-1">
          <p className="text-xs text-gray-400">로그인 중</p>
          {/* truncate: 이름이 길면 말줄임표 처리 */}
          <p className="truncate text-sm font-semibold text-gray-700">
            {userName}
          </p>
        </div>

        {/* 로그아웃 버튼 */}
        <button
          onClick={handleLogout}
          disabled={isLoggingOut}
          className="w-full rounded-lg border border-gray-200 py-2 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isLoggingOut ? "로그아웃 중..." : "로그아웃"}
        </button>
      </div>
    </aside>
  );
}
