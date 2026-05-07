import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";

// Next.js 16에서 middleware.ts는 deprecated → proxy.ts로 변경됨
// Proxy는 기본적으로 Node.js 런타임에서 실행되므로 jsonwebtoken 사용 가능

// 로그인 없이 접근 가능한 공개 경로 목록
const PUBLIC_PATHS = ["/login", "/register"];

// 쿠키의 JWT 토큰이 유효한지 검증
// Proxy에서는 DB 조회 없이 토큰 서명만 확인 (낙관적 검증)
function isTokenValid(token: string): boolean {
  // JWT_SECRET 환경변수 미설정 시 검증 불가
  const jwtSecret = process.env.JWT_SECRET;
  if (!jwtSecret) return false;

  try {
    // 서명 검증 (만료 포함): 실패 시 예외 발생
    jwt.verify(token, jwtSecret);
    return true;
  } catch {
    // 만료(TokenExpiredError), 위조(JsonWebTokenError) 등 모두 false 반환
    return false;
  }
}

// 프록시 함수: 모든 요청에 대해 인증 상태를 확인하고 라우팅 결정
export function proxy(request: NextRequest): NextResponse {
  const { pathname } = request.nextUrl;

  // 현재 요청 경로가 공개 경로에 해당하는지 확인
  const isPublicPath = PUBLIC_PATHS.some((path) =>
    pathname.startsWith(path)
  );

  // 쿠키에서 JWT 토큰 추출 (httpOnly 쿠키는 서버에서만 읽기 가능)
  const token = request.cookies.get("token")?.value;

  // 토큰 존재 여부 + 유효성 검증으로 로그인 상태 확인
  const isLoggedIn = token ? isTokenValid(token) : false;

  if (isPublicPath) {
    if (isLoggedIn) {
      // 이미 로그인된 상태로 /login 또는 /register 접근 시 /board로 리다이렉트
      return NextResponse.redirect(new URL("/board", request.nextUrl));
    }
    // 비로그인 상태에서 공개 경로 접근 허용
    return NextResponse.next();
  }

  // 보호된 경로: 비로그인 사용자는 /login으로 리다이렉트
  if (!isLoggedIn) {
    return NextResponse.redirect(new URL("/login", request.nextUrl));
  }

  // 로그인 상태에서 보호된 경로 접근 허용
  return NextResponse.next();
}

// 프록시가 실행될 경로 지정
// api, _next/static, _next/image, favicon.ico는 인증 체크 제외
export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon\\.ico).*)"],
};
