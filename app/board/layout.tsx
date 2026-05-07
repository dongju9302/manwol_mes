import { redirect } from "next/navigation";
import pool from "@/lib/db";
import { verifyAuthFromCookies } from "@/lib/auth";
import Sidebar from "@/app/components/Sidebar";

// board 레이아웃 — 서버 컴포넌트
// /board/** 모든 경로에 사이드바 레이아웃을 적용
// /login, /register는 app/layout.tsx를 직접 상속하므로 사이드바 미적용
export default async function BoardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // 로그인 여부 확인: 미로그인 시 /login으로 리다이렉트
  const authUser = await verifyAuthFromCookies();
  if (!authUser) {
    redirect("/login");
  }

  // 사이드바 하단에 표시할 사용자 이름 조회
  const result = await pool.query<{ name: string }>(
    "SELECT name FROM users WHERE id = $1",
    [authUser.userId]
  );
  const userName = result.rows[0]?.name ?? "";

  return (
    // 전체 뷰포트를 채우는 가로 flex 컨테이너
    <div className="flex h-screen bg-gray-50">
      {/* 좌측 사이드바: 모바일에서 hidden, md 이상에서 표시 */}
      <Sidebar userName={userName} />

      {/* 우측 메인 콘텐츠: 남은 공간을 채우고 세로 스크롤 허용 */}
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  );
}
