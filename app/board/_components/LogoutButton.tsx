"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

// 로그아웃 버튼 — 클라이언트 컴포넌트
// POST /api/auth/logout 호출 → token 쿠키 삭제 → /login으로 이동
export default function LogoutButton() {
  // 페이지 이동을 위한 라우터
  const router = useRouter();
  // 로그아웃 요청 중 중복 클릭 방지
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // 로그아웃 클릭 핸들러
  const handleLogout = async (): Promise<void> => {
    setIsLoading(true);

    try {
      // POST /api/auth/logout: 서버에서 token 쿠키를 삭제
      await fetch("/api/auth/logout", { method: "POST" });
      // 쿠키 삭제 후 로그인 페이지로 이동 (replace로 뒤로가기 방지)
      router.replace("/login");
    } catch {
      // 네트워크 오류가 발생해도 로그인 페이지로 이동
      router.replace("/login");
    }
  };

  return (
    <button
      onClick={handleLogout}
      disabled={isLoading}
      className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50"
    >
      {isLoading ? "로그아웃 중..." : "로그아웃"}
    </button>
  );
}
