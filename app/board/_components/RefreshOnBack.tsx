"use client";

import { useEffect } from "react";

// 브라우저 뒤로가기로 bfcache에서 페이지가 복원된 경우
// 강제 새로고침하여 최신 데이터(조회수 등) 반영
export default function RefreshOnBack() {
  useEffect(() => {
    const handlePageShow = (event: PageTransitionEvent): void => {
      // event.persisted = true 이면 bfcache에서 복원된 상태
      // router.refresh()는 bfcache 복원 직후에 안정성이 떨어지므로
      // window.location.reload()로 강제 갱신
      if (event.persisted) {
        window.location.reload();
      }
    };

    window.addEventListener("pageshow", handlePageShow);
    return () => window.removeEventListener("pageshow", handlePageShow);
  }, []);

  // UI 없이 이벤트 리스너만 등록
  return null;
}
