import { redirect } from "next/navigation";
import { verifyAuthFromCookies } from "@/lib/auth";

// admin 레이아웃 — 서버 컴포넌트
// /admin/** 전체에 서버 측 인증·권한 검증 적용 (proxy.ts와 이중 보호)
// 헤더·사이드바는 루트의 LayoutProvider(app/layout.tsx)에서 처리
export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // 로그인 여부 검증
  const authUser = await verifyAuthFromCookies();
  if (!authUser) {
    redirect("/login");
  }

  // master 역할 검증 (방어적 이중 확인)
  if (authUser.role !== "master") {
    redirect("/unauthorized");
  }

  // 인증·권한 통과: children을 그대로 렌더링
  return <>{children}</>;
}
