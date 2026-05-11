import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import pool from "@/lib/db";

// 로그인 없이 접근 가능한 공개 경로 목록
const PUBLIC_PATHS = ["/login", "/register", "/unauthorized"];

// JWT 페이로드에서 추출할 사용자 정보
interface ProxyPayload {
  // 사용자 고유 식별자
  userId: string;
  // 사용자 이메일
  email: string;
  // 권한 역할: 'master' | 'admin' | 'user'
  role?: string;
  // 계정 활성화 여부 (JWT 발급 시점 값 — DB 조회로 재확인)
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

// DB 에서 사용자 존재 여부와 활성화 상태를 확인
// 가벼운 쿼리: id, is_active 만 조회, is_deleted 제외, LIMIT 1
// DB 오류 시 null 반환 → fail-open (DB 장애가 전체 로그아웃으로 이어지지 않도록)
async function fetchUserStatus(
  userId: string
): Promise<{ is_active: boolean } | null | "not_found"> {
  try {
    const result = await pool.query<{ is_active: boolean }>(
      "SELECT is_active FROM users WHERE id = $1 AND is_deleted = false LIMIT 1",
      [userId]
    );
    // 사용자가 DB 에 없거나 soft-delete 된 경우
    if (result.rows.length === 0) return "not_found";
    return result.rows[0];
  } catch {
    // DB 연결 오류 등 예외 → null 로 fail-open
    return null;
  }
}

// 토큰 쿠키 삭제 후 /login 으로 리다이렉트하는 응답 생성
function redirectToLogin(request: NextRequest): NextResponse {
  const response = NextResponse.redirect(new URL("/login", request.nextUrl));
  // HttpOnly 쿠키는 JS 에서 접근 불가이므로 서버에서 직접 삭제
  response.cookies.delete("token");
  return response;
}

// 프록시 함수: 모든 요청에 대해 인증 상태 및 권한을 확인하고 라우팅 결정
export async function proxy(request: NextRequest): Promise<NextResponse> {
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

  // ── JWT 유효 시 DB 재확인 ─────────────────────────────────────
  // 토큰만 유효하고 DB 에 사용자가 없는 경우(계정 삭제·DB 초기화 등)를 차단
  if (isLoggedIn && payload) {
    const userStatus = await fetchUserStatus(payload.userId);

    if (userStatus === "not_found") {
      // DB 에 사용자가 없음 → 무효 토큰으로 간주, 강제 로그아웃
      return redirectToLogin(request);
    }

    if (userStatus !== null && !userStatus.is_active) {
      // 사용자는 존재하지만 비활성화 상태 → 강제 로그아웃
      return redirectToLogin(request);
    }
    // userStatus === null: DB 오류 → fail-open, 기존 JWT 결과로 계속 진행
  }

  if (isPublicPath) {
    if (isLoggedIn) {
      // 이미 로그인된 상태로 공개 경로 접근 시 /board 로 리다이렉트
      return NextResponse.redirect(new URL("/board", request.nextUrl));
    }
    // 비로그인 상태에서 공개 경로 접근 허용
    return NextResponse.next();
  }

  // 보호된 경로: 비로그인 사용자는 /login 으로 리다이렉트
  if (!isLoggedIn) {
    return NextResponse.redirect(new URL("/login", request.nextUrl));
  }

  // /admin/** 접근 시 master 역할만 허용, 그 외 /unauthorized 로 이동
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
// 제외 조건 (인증 체크 없이 통과):
//   api          — API 라우트
//   _next/static — Next.js 번들·CSS·JS 정적 파일
//   _next/image  — Next.js 이미지 최적화 엔드포인트
//   .*\\..*      — 확장자가 있는 모든 파일 (favicon.ico, icon*.svg/png, manifest.json 등)
export const config = {
  matcher: ["/((?!api|_next/static|_next/image|.*\\..*).*)" ],
};
