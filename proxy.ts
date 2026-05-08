import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";

// Next.js 16에서 middleware.ts는 deprecated → proxy.ts로 변경됨
// Proxy는 기본적으로 Node.js 런타임에서 실행되므로 jsonwebtoken 사용 가능

// 로그인 없이 접근 가능한 공개 경로 목록
const PUBLIC_PATHS = ["/login", "/register", "/unauthorized"];

// JWT 페이로드에서 추출할 사용자 정보 (DB 없이 서명만 검증하는 낙관적 검증)
interface ProxyPayload {
  // 사용자 고유 식별자
  userId: string;
  // 사용자 이메일
  email: string;
  // 권한 역할: 'master' | 'admin' | 'user'
  role?: string;
  // 계정 활성화 여부
  isActive?: boolean;
}

// 쿠키의 JWT 토큰을 검증 후 페이로드 반환
// 서명 불일치·만료·환경변수 미설정 시 null 반환
function decodeToken(token: string): ProxyPayload | null {
  const jwtSecret = process.env.JWT_SECRET;
  if (!jwtSecret) return null;

  try {
    // 서명 검증 (만료 포함): 실패 시 예외 발생
    return jwt.verify(token, jwtSecret) as ProxyPayload;
  } catch {
    // 만료(TokenExpiredError), 위조(JsonWebTokenError) 등 모두 null 반환
    return null;
  }
}

// 프록시 함수: 모든 요청에 대해 인증 상태 및 권한을 확인하고 라우팅 결정
export function proxy(request: NextRequest): NextResponse {
  const { pathname } = request.nextUrl;

  // 현재 요청 경로가 공개 경로에 해당하는지 확인
  const isPublicPath = PUBLIC_PATHS.some((path) =>
    pathname.startsWith(path)
  );

  // 쿠키에서 JWT 토큰 추출 (httpOnly 쿠키는 서버에서만 읽기 가능)
  const token = request.cookies.get("token")?.value;

  // 토큰 검증 — 유효하면 페이로드 반환, 실패 시 null
  const payload = token ? decodeToken(token) : null;
  const isLoggedIn = payload !== null;

  if (isPublicPath) {
    if (isLoggedIn) {
      // 이미 로그인된 상태로 공개 경로 접근 시 /board로 리다이렉트
      return NextResponse.redirect(new URL("/board", request.nextUrl));
    }
    // 비로그인 상태에서 공개 경로 접근 허용
    return NextResponse.next();
  }

  // 보호된 경로: 비로그인 사용자는 /login으로 리다이렉트
  if (!isLoggedIn) {
    return NextResponse.redirect(new URL("/login", request.nextUrl));
  }

  // 비활성화 계정(isActive: false) → 토큰 삭제 후 /login으로 리다이렉트
  // JWT 서명 기반 낙관적 검증 (실시간 DB 조회는 서버 컴포넌트에서 수행)
  if (payload.isActive === false) {
    const response = NextResponse.redirect(
      new URL("/login", request.nextUrl)
    );
    // HttpOnly 쿠키는 JS에서 접근 불가이므로 서버에서 직접 삭제
    response.cookies.delete("token");
    return response;
  }

  // /admin/** 접근 시 master 역할만 허용, 그 외 /unauthorized로 이동
  if (pathname.startsWith("/admin")) {
    if (payload.role !== "master") {
      return NextResponse.redirect(
        new URL("/unauthorized", request.nextUrl)
      );
    }
  }

  // 로그인 상태 + 활성 계정 + 권한 충족 → 요청 통과
  return NextResponse.next();
}

// 프록시가 실행될 경로 지정
// api, _next/static, _next/image, favicon.ico는 인증 체크 제외
export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon\\.ico).*)"],
};
