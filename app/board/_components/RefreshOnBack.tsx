"use client";

import { useEffect } from "react";

// 브라우저 뒤로가기/앞으로가기 버튼으로 페이지 진입 시
// window.location.reload()로 강제 새로고침하여 최신 데이터 반영.
//
// Next.js의 클라이언트 사이드 라우팅에서는 pageshow 이벤트가 발생하지 않으므로,
// popstate 이벤트(history navigation)와 visibilitychange를 함께 감지.
export default function RefreshOnBack() {
  useEffect(() => {
    console.log("[DEBUG-RefreshOnBack] 마운트 시각:", new Date().toISOString());

    const handlePopState = (): void => {
      console.log("[DEBUG-RefreshOnBack] popstate 감지 → reload 실행");
      window.location.reload();
    };

    const handleVisibilityChange = (): void => {
      console.log("[DEBUG-RefreshOnBack] visibilitychange:", document.visibilityState);
    };

    window.addEventListener("popstate", handlePopState);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      window.removeEventListener("popstate", handlePopState);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);

  return null;
}
