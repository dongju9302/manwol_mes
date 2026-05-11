"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { NAV_CATEGORIES, type NavCategory } from "@/lib/navigation";

// 헤더에 표시할 사용자 정보 타입
export interface HeaderUser {
  name: string;
  role: string;
  email: string;
}

// 헤더 props 타입
interface HeaderProps {
  // LayoutProvider에서 주입. null이면 비로그인 상태
  user: HeaderUser | null;
  // 로그아웃 성공 후 LayoutProvider가 user 상태를 초기화하는 콜백
  onLogout?: () => void;
}

// 헤더 컴포넌트 — 클라이언트 컴포넌트
// 좌측 로고 / 대분류 호버 드롭다운 / 우측 사용자명+로그아웃
// 모바일: 햄버거 → 전체 너비 모바일 메뉴 드로어
export default function Header({ user, onLogout }: HeaderProps) {
  const router = useRouter();

  // 현재 열린 드롭다운 대분류 키 (null: 모두 닫힘)
  const [activeKey, setActiveKey] = useState<string | null>(null);
  // 드롭다운 닫힘 지연 타이머 (마우스가 카테고리→드롭다운 이동 시 깜빡임 방지)
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // 모바일 메뉴 드로어 열림 여부
  const [isMobileOpen, setIsMobileOpen] = useState<boolean>(false);
  // 로그아웃 요청 중 상태
  const [isLoggingOut, setIsLoggingOut] = useState<boolean>(false);

  // 헤더 외부 클릭 시 드롭다운 닫기
  const headerRef = useRef<HTMLElement>(null);
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        headerRef.current &&
        !headerRef.current.contains(e.target as Node)
      ) {
        setActiveKey(null);
        setIsMobileOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // 드롭다운 열기 (지연 닫힘 취소 후 즉시 오픈)
  const openDropdown = useCallback((key: string) => {
    if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
    setActiveKey(key);
  }, []);

  // 드롭다운 닫기 (200ms 지연으로 드롭다운 내부 이동 시 깜빡임 방지)
  const scheduleClose = useCallback(() => {
    closeTimerRef.current = setTimeout(() => setActiveKey(null), 200);
  }, []);

  // 로그아웃 핸들러
  // API 호출 성공 후 onLogout() 실행 → LayoutProvider에서 setUser(null) + 페이지 이동
  // API 실패 시에도 동일하게 onLogout() 호출하여 강제 로그아웃 처리
  const handleLogout = async (): Promise<void> => {
    setIsLoggingOut(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch {
      // 네트워크 오류여도 클라이언트 상태는 초기화
    } finally {
      // 성공·실패 모두 상태 초기화 및 /login 이동을 부모에게 위임
      onLogout?.();
    }
  };

  // 현재 사용자 역할 기준으로 표시 가능한 중분류 필터링
  const getVisibleItems = (category: NavCategory) =>
    category.items.filter(
      (item) => !item.masterOnly || user?.role === "master"
    );

  return (
    <header
      ref={headerRef}
      className="sticky top-0 z-40 flex h-14 items-center border-b border-gray-200 bg-white px-4 shadow-sm"
    >
      {/* ── 로고 이미지 ── */}
      <Link
        href="/"
        className="mr-8 shrink-0"
        onClick={() => setIsMobileOpen(false)}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/logo.png" alt="Manwol MES" className="h-6 w-auto" />
      </Link>

      {/* ── 데스크탑 대분류 내비게이션 ── */}
      <nav className="hidden flex-1 items-center gap-1 md:flex">
        {NAV_CATEGORIES.map((category) => {
          const visibleItems = getVisibleItems(category);
          const hasDropdown = visibleItems.length > 0;
          const isOpen = activeKey === category.key;

          return (
            <div
              key={category.key}
              className="relative"
              onMouseEnter={() => hasDropdown && openDropdown(category.key)}
              onMouseLeave={scheduleClose}
            >
              {/* 대분류 버튼: 심플 텍스트 스타일, 화살표 없음 */}
              <button
                type="button"
                className={[
                  "rounded-md px-3 py-2 text-sm font-medium transition-colors",
                  isOpen
                    ? "text-blue-600"
                    : "text-gray-600 hover:text-gray-900",
                  !hasDropdown ? "cursor-default" : "cursor-pointer",
                ].join(" ")}
              >
                {category.label}
              </button>

              {/* 중분류 드롭다운 */}
              {isOpen && hasDropdown && (
                <div
                  className="absolute left-0 top-full mt-1 min-w-[120px] overflow-hidden rounded-xl border border-gray-200 bg-white py-1 shadow-lg"
                  onMouseEnter={() => openDropdown(category.key)}
                  onMouseLeave={scheduleClose}
                >
                  {visibleItems.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setActiveKey(null)}
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-600"
                    >
                      {item.label}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </nav>

      {/* ── 우측: 사용자명 + 로그아웃 (데스크탑) ── */}
      {user && (
        <div className="ml-auto hidden items-center gap-3 md:flex">
          {/* 역할 배지 (master/admin만 표시) */}
          {(user.role === "master" || user.role === "admin") && (
            <span
              className={[
                "rounded px-1.5 py-0.5 text-xs font-semibold",
                user.role === "master"
                  ? "bg-purple-100 text-purple-700"
                  : "bg-blue-100 text-blue-700",
              ].join(" ")}
            >
              {user.role === "master" ? "Master" : "Admin"}
            </span>
          )}
          {/* 사용자 이름 */}
          <span className="text-sm font-medium text-gray-700">
            {user.name}
          </span>
          {/* 로그아웃 버튼 */}
          <button
            type="button"
            onClick={handleLogout}
            disabled={isLoggingOut}
            className="cursor-pointer rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isLoggingOut ? "로그아웃 중..." : "로그아웃"}
          </button>
        </div>
      )}

      {/* ── 모바일 햄버거 버튼 ── */}
      <button
        type="button"
        onClick={() => setIsMobileOpen((prev) => !prev)}
        className="ml-auto flex min-h-[44px] min-w-[44px] cursor-pointer items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100 md:hidden"
        aria-label="메뉴 열기"
      >
        {isMobileOpen ? (
          // X 아이콘 (닫기)
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        ) : (
          // 햄버거 아이콘 (열기)
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        )}
      </button>

      {/* ── 모바일 드로어 (헤더 아래로 펼쳐짐) ── */}
      {isMobileOpen && (
        <div className="absolute left-0 right-0 top-14 border-b border-gray-200 bg-white shadow-lg md:hidden">
          <nav className="px-4 py-3">
            {NAV_CATEGORIES.map((category) => {
              const visibleItems = getVisibleItems(category);
              return (
                <div key={category.key} className="py-1">
                  {/* 대분류 레이블 */}
                  <p className="mb-1 px-2 text-xs font-semibold uppercase tracking-wide text-gray-400">
                    {category.label}
                  </p>

                  {visibleItems.length === 0 ? (
                    // 중분류 없음 표시
                    <p className="px-2 py-1 text-xs text-gray-300">
                      준비 중
                    </p>
                  ) : (
                    visibleItems.map((item) => (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setIsMobileOpen(false)}
                        className="flex min-h-[44px] items-center rounded-lg px-2 py-3 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-600"
                      >
                        {item.label}
                      </Link>
                    ))
                  )}
                </div>
              );
            })}
          </nav>

          {/* 모바일 사용자 영역 */}
          {user && (
            <div className="border-t border-gray-100 px-4 py-3">
              <div className="mb-2 flex items-center gap-2">
                <span className="text-sm font-medium text-gray-700">
                  {user.name}
                </span>
                {(user.role === "master" || user.role === "admin") && (
                  <span
                    className={[
                      "rounded px-1.5 py-0.5 text-xs font-semibold",
                      user.role === "master"
                        ? "bg-purple-100 text-purple-700"
                        : "bg-blue-100 text-blue-700",
                    ].join(" ")}
                  >
                    {user.role === "master" ? "Master" : "Admin"}
                  </span>
                )}
              </div>
              <button
                type="button"
                onClick={handleLogout}
                disabled={isLoggingOut}
                className="w-full cursor-pointer rounded-lg border border-gray-200 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isLoggingOut ? "로그아웃 중..." : "로그아웃"}
              </button>
            </div>
          )}
        </div>
      )}
    </header>
  );
}
