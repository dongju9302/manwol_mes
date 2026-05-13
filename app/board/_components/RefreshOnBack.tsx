"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

// 브라우저 뒤로가기로 돌아왔을 때 페이지를 새로 그리도록 강제
// bfcache(브라우저 캐시)에서 복원된 경우 router.refresh()로 데이터 갱신
// 게시판 목록의 조회수/좋아요/댓글 수를 항상 최신으로 유지
export default function RefreshOnBack() {
  const router = useRouter();

  useEffect(() => {
    const handlePageShow = (event: PageTransitionEvent): void => {
      // event.persisted = true 이면 bfcache에서 복원된 것
      if (event.persisted) {
        router.refresh();
      }
    };

    window.addEventListener("pageshow", handlePageShow);
    return () => window.removeEventListener("pageshow", handlePageShow);
  }, [router]);

  // UI 없이 이벤트 리스너만 등록
  return null;
}
