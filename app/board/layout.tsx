import { redirect } from "next/navigation";
import { verifyAuthFromCookies } from "@/lib/auth";

// board 레이아웃 — 서버 컴포넌트
// /board/** 전체에 서버 측 인증 검증 적용
// 헤더·사이드바는 루트의 LayoutProvider(app/layout.tsx)에서 처리
export default async function BoardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // 로그인 여부 서버 검증: 미로그인 시 /login으로 리다이렉트 (proxy.ts 이중 보호)
  const authUser = await verifyAuthFromCookies();
  if (!authUser) {
    redirect("/login");
  }

  // 인증 통과: children을 그대로 렌더링 (레이아웃 래퍼 없음)
  return <>{children}</>;
}
