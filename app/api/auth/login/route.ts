import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import pool from "@/lib/db";

// JWT 토큰 만료 시간 (7일)
const JWT_EXPIRES_IN = "7d";

// 쿠키 만료 시간 (7일, 초 단위)
const COOKIE_MAX_AGE = 60 * 60 * 24 * 7;

// 이메일 형식 검증 정규식
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// 비밀번호 최소 길이
const MIN_PASSWORD_LENGTH = 8;

// JWT 페이로드 타입 정의
interface JwtPayload {
  // 사용자 고유 식별자
  userId: string;
  // 사용자 이메일
  email: string;
  // 권한 역할
  role: string;
  // 계정 활성화 여부
  isActive: boolean;
}

// DB에서 조회한 사용자 행 타입 정의
interface UserRow {
  // SERIAL PK (정수)
  id: number;
  // 로그인 이메일
  email: string;
  // bcrypt 해시 비밀번호
  password: string;
  // 권한 역할: 'master' | 'admin' | 'user'
  role: string;
  // 계정 활성화 여부
  is_active: boolean;
}

// POST /api/auth/login — 이메일 + 비밀번호로 로그인 처리
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    // 요청 본문에서 이메일, 비밀번호 추출
    const body: { email: string; password: string } = await request.json();
    const { email, password } = body;

    // 이메일, 비밀번호 필수값 검증
    if (!email || !password) {
      return NextResponse.json(
        { message: "이메일과 비밀번호를 입력해주세요." },
        { status: 400 }
      );
    }

    // 이메일 형식 검증
    if (!EMAIL_REGEX.test(email)) {
      return NextResponse.json(
        { message: "올바른 이메일 형식이 아닙니다." },
        { status: 400 }
      );
    }

    // 비밀번호 최소 길이 검증
    if (password.length < MIN_PASSWORD_LENGTH) {
      return NextResponse.json(
        { message: `비밀번호는 최소 ${MIN_PASSWORD_LENGTH}자 이상이어야 합니다.` },
        { status: 400 }
      );
    }

    // 이메일 소문자 정규화 (대소문자 구분 없이 동일 계정으로 처리)
    const normalizedEmail: string = email.toLowerCase();

    // DB에서 이메일로 사용자 조회 (role, is_active 포함)
    // is_deleted = false: soft delete(탈퇴)된 계정은 로그인 불가
    // 탈퇴 계정도 "이메일 또는 비밀번호 불일치" 메시지로 처리 (계정 존재 여부 노출 방지)
    const result = await pool.query<UserRow>(
      `SELECT id, email, password, role, is_active FROM users WHERE email = $1 AND is_deleted = false`,
      [normalizedEmail]
    );

    // 조회 결과에서 첫 번째 행 추출 (없으면 undefined)
    const user: UserRow | undefined = result.rows[0];

    // bcryptjs로 비밀번호 검증
    // 사용자가 없을 때도 compare를 실행해 응답 시간을 일정하게 유지 (타이밍 공격 방지)
    const dummyHash =
      "$2b$10$invalidhashfortimingattackprevention000000000000000000";
    const isPasswordValid: boolean = user
      ? await bcrypt.compare(password, user.password)
      : await bcrypt.compare(password, dummyHash);

    // 사용자 미존재 또는 비밀번호 불일치 시 동일 메시지 반환 (사용자 열거 공격 방지)
    if (!user || !isPasswordValid) {
      return NextResponse.json(
        { message: "이메일 또는 비밀번호가 올바르지 않습니다." },
        { status: 401 }
      );
    }

    // 비활성화 계정 로그인 차단 (비밀번호 검증 통과 후 확인)
    if (!user.is_active) {
      return NextResponse.json(
        { message: "비활성화된 계정입니다. 관리자에게 문의하세요." },
        { status: 403 }
      );
    }

    // JWT_SECRET 환경변수 미설정 시 서버 오류 처리 (폴백 기본값 사용 금지)
    const jwtSecret: string = process.env.JWT_SECRET ?? "";
    if (!jwtSecret) {
      console.error("JWT_SECRET 환경변수가 설정되지 않았습니다.");
      return NextResponse.json(
        { message: "서버 설정 오류가 발생했습니다." },
        { status: 500 }
      );
    }

    // JWT 토큰 생성 (페이로드에 userId, email, role, isActive 포함)
    const payload: JwtPayload = {
      userId: String(user.id),
      email: user.email,
      role: user.role,
      isActive: user.is_active,
    };
    const token: string = jwt.sign(payload, jwtSecret, {
      expiresIn: JWT_EXPIRES_IN,
    });

    // 성공 응답 생성
    const response: NextResponse = NextResponse.json(
      { message: "로그인 성공" },
      { status: 200 }
    );

    // HttpOnly + Secure 쿠키에 JWT 토큰 저장 (XSS 공격 방지, HTTPS 전용 전송)
    response.cookies.set("token", token, {
      httpOnly: true,
      // COOKIE_SECURE=true 환경변수로 명시적 제어 (HTTPS 환경에서만 true로 설정)
      secure: process.env.COOKIE_SECURE === "true",
      sameSite: "lax",
      maxAge: COOKIE_MAX_AGE,
      path: "/",
    });

    return response;
  } catch (error) {
    // 예상치 못한 서버 오류 처리
    console.error("로그인 처리 중 오류 발생:", error);
    return NextResponse.json(
      { message: "서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요." },
      { status: 500 }
    );
  }
}
