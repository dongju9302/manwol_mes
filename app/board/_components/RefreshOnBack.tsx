"use client";

import { useEffect } from "react";

// 브라우저 뒤로가기/앞으로가기로 게시판 목록 진입 시 강제 새로고침
// Next.js 클라이언트 라우팅에서 popstate 이벤트로 감지
export default function RefreshOnBack() {
  useEffect(() => {
    const handlePopState = (): void => {
      window.location.reload();
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  return null;
}
