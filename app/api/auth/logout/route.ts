import { NextResponse } from "next/server";

// POST /api/auth/logout — 로그아웃 처리
// token 쿠키를 삭제해 인증 상태를 해제한 뒤 /login으로 리다이렉트
export async function POST(): Promise<NextResponse> {
  // /login으로 리다이렉트하는 응답 생성
  const response = NextResponse.redirect(
    new URL("/login", process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000")
  );

  // token 쿠키 삭제: maxAge를 0으로 설정하면 브라우저가 즉시 만료 처리
  response.cookies.set("token", "", {
    httpOnly: true,
    // COOKIE_SECURE=true 환경변수로 명시적 제어 (login/route.ts와 동일한 설정)
    secure: process.env.COOKIE_SECURE === "true",
    sameSite: "lax",
    maxAge: 0,
    path: "/",
  });

  return response;
}
