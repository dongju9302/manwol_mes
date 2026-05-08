"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { NAV_CATEGORIES, type SubItem } from "@/lib/navigation";

// 사이드바 props 타입
interface SidebarProps {
  // 현재 로그인한 사용자 역할 (소분류 필터링에 사용)
  userRole: string;
}

// 현재 경로에 대응하는 소분류 목록 탐색
// 대분류 → 중분류 순서로 탐색, 경로가 일치하는 중분류의 소분류를 반환
function findSubItems(pathname: string, userRole: string): SubItem[] {
  for (const category of NAV_CATEGORIES) {
    for (const item of category.items) {
      // 정확히 일치하거나 하위 경로인 경우 해당 중분류로 판단
      if (pathname === item.href || pathname.startsWith(item.href + "/")) {
        // 역할 기준으로 소분류 필터링 (masterOnly → master만 접근 가능)
        return (item.subItems ?? []).filter(
          (sub) => !sub.masterOnly || userRole === "master"
        );
      }
    }
  }
  return [];
}

// 사이드바 컴포넌트 — 클라이언트 컴포넌트
// 소분류(3단계) 항목만 표시하는 좌측 사이드바
// 소분류가 없으면 null 반환(사이드바 미표시)
// 기본: 접힘(아이콘만, w-14) / 호버: 임시 펼침 / 핀 고정: 항상 펼침(w-48)
export default function Sidebar({ userRole }: SidebarProps) {
  const pathname = usePathname();

  // 핀 고정 여부: true → 항상 펼침 유지
  const [isPinned, setIsPinned] = useState<boolean>(false);
  // 마우스 호버 여부: true → 임시 펼침
  const [isHovered, setIsHovered] = useState<boolean>(false);

  // 현재 경로에 해당하는 소분류 항목 목록
  const subItems = findSubItems(pathname, userRole);

  // 소분류가 없으면 사이드바 렌더링 안 함
  if (subItems.length === 0) return null;

  // 실제 펼침 상태: 핀 고정 OR 마우스 호버 중
  const isExpanded = isPinned || isHovered;

  return (
    <aside
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={[
        // 세로 flex 컨테이너, 높이 전체, 오버플로 숨김, 부드러운 너비 전환
        "flex h-full shrink-0 flex-col overflow-hidden border-r border-gray-200 bg-white transition-all duration-200",
        // 펼침: 12rem / 접힘: 3.5rem
        isExpanded ? "w-48" : "w-14",
      ].join(" ")}
    >
      {/* 핀 고정 / 접힘 토글 버튼 */}
      <div className="flex h-10 items-center justify-end border-b border-gray-100 px-2">
        <button
          type="button"
          onClick={() => setIsPinned((prev) => !prev)}
          className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-md text-gray-400 hover:bg-gray-100 hover:text-gray-600"
          title={isPinned ? "사이드바 접기" : "사이드바 고정"}
        >
          {isPinned ? (
            // 접기 아이콘 (chevron left)
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          ) : (
            // 고정 아이콘 (chevron right)
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          )}
        </button>
      </div>

      {/* 소분류 메뉴 목록 */}
      <nav className="flex-1 overflow-y-auto py-3">
        <ul className="space-y-0.5 px-2">
          {subItems.map((sub) => {
            // 현재 경로와 일치 여부로 활성 상태 판별
            const isActive =
              pathname === sub.href || pathname.startsWith(sub.href + "/");

            return (
              <li key={sub.href}>
                <Link
                  href={sub.href}
                  className={[
                    "flex items-center gap-2 rounded-lg px-2 py-2 text-sm font-medium transition-colors",
                    isExpanded ? "" : "justify-center",
                    isActive
                      ? "bg-blue-50 text-blue-600"
                      : "text-gray-600 hover:bg-gray-100 hover:text-gray-800",
                  ].join(" ")}
                  title={!isExpanded ? sub.label : undefined}
                >
                  {/* 접힌 상태: 레이블 첫 글자를 아이콘 대용으로 표시 */}
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center text-xs font-bold">
                    {sub.label.charAt(0)}
                  </span>
                  {/* 펼친 상태에서만 텍스트 표시 */}
                  {isExpanded && (
                    <span className="truncate">{sub.label}</span>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </aside>
  );
}
