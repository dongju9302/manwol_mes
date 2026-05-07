import { NextRequest } from "next/server";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";

// 로그인 시 JWT에 저장된 페이로드 구조 (login/route.ts와 동일)
interface JwtPayload {
  // 사용자 고유 식별자 (문자열로 저장됨)
  userId: string;
  // 사용자 이메일
  email: string;
  // 발급 시각 (jsonwebtoken 자동 추가)
  iat: number;
  // 만료 시각 (jsonwebtoken 자동 추가)
  exp: number;
}

// 검증 성공 시 반환하는 인증된 사용자 정보 타입
export interface AuthUser {
  // DB의 SERIAL PK (정수)
  userId: number;
  // 사용자 이메일
  email: string;
}

// 쿠키에서 JWT를 꺼내 검증 후 사용자 정보 반환
// 토큰 없음·만료·위조 등 모든 실패 케이스에서 null 반환
export function verifyAuth(request: NextRequest): AuthUser | null {
  // 쿠키에서 token 값 추출
  const token: string | undefined = request.cookies.get("token")?.value;
  if (!token) return null;

  // JWT_SECRET 환경변수 확인
  const jwtSecret: string | undefined = process.env.JWT_SECRET;
  if (!jwtSecret) return null;

  try {
    // 서명 검증 및 페이로드 디코딩
    const decoded = jwt.verify(token, jwtSecret) as JwtPayload;

    return {
      // JWT payload의 userId는 문자열이므로 정수로 변환
      userId: parseInt(decoded.userId, 10),
      email: decoded.email,
    };
  } catch {
    // 만료(TokenExpiredError), 위조(JsonWebTokenError) 등 모든 검증 실패
    return null;
  }
}

// 서버 컴포넌트용: next/headers의 cookies()로 JWT 검증 (async)
// Route Handler가 아닌 page.tsx 등 서버 컴포넌트에서 사용
export async function verifyAuthFromCookies(): Promise<AuthUser | null> {
  // next/headers cookies()는 비동기 함수 (Next.js 15+)
  const cookieStore = await cookies();
  const token: string | undefined = cookieStore.get("token")?.value;
  if (!token) return null;

  // JWT_SECRET 환경변수 확인
  const jwtSecret: string | undefined = process.env.JWT_SECRET;
  if (!jwtSecret) return null;

  try {
    // 서명 검증 및 페이로드 디코딩
    const decoded = jwt.verify(token, jwtSecret) as JwtPayload;

    return {
      // JWT payload의 userId는 문자열이므로 정수로 변환
      userId: parseInt(decoded.userId, 10),
      email: decoded.email,
    };
  } catch {
    // 만료·위조 등 모든 검증 실패
    return null;
  }
}
