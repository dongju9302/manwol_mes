import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import pool from "@/lib/db";

// JWT 토큰 만료 시간 (login/route.ts와 동일)
const JWT_EXPIRES_IN = "7d";
// 쿠키 만료 시간 (7일, 초 단위)
const COOKIE_MAX_AGE = 60 * 60 * 24 * 7;

// 비밀번호 해시에 사용할 salt 라운드 수 (높을수록 보안 강화, 느려짐)
const SALT_ROUNDS = 10;

// 이메일 형식 검증 정규식
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// 연락처 형식 검증 정규식: 010-XXXX-XXXX (010으로 시작하는 11자리 숫자 + 하이픈)
const PHONE_REGEX = /^010-\d{4}-\d{4}$/;

// 비밀번호 최소 길이
const MIN_PASSWORD_LENGTH = 8;

// POST /api/auth/register — 신규 사용자 회원가입 처리
export async function POST(request: NextRequest): Promise<Response> {
  try {
    // 요청 본문에서 이름, 연락처, 이메일, 비밀번호 추출
    const body: { name: string; phone: string; email: string; password: string } =
      await request.json();
    const { name, phone, email, password } = body;

    // 이름, 연락처, 이메일, 비밀번호 필수값 검증
    if (!name || !phone || !email || !password) {
      return Response.json(
        { message: "이름, 연락처, 이메일, 비밀번호를 모두 입력해주세요." },
        { status: 400 }
      );
    }

    // 연락처 형식 검증 (010-XXXX-XXXX)
    if (!PHONE_REGEX.test(phone)) {
      return Response.json(
        { message: "연락처는 010으로 시작하는 11자리 숫자여야 합니다. (예: 010-1234-5678)" },
        { status: 400 }
      );
    }

    // 이메일 형식 검증
    if (!EMAIL_REGEX.test(email)) {
      return Response.json(
        { message: "올바른 이메일 형식이 아닙니다." },
        { status: 400 }
      );
    }

    // 비밀번호 최소 길이 검증
    if (password.length < MIN_PASSWORD_LENGTH) {
      return Response.json(
        {
          message: `비밀번호는 최소 ${MIN_PASSWORD_LENGTH}자 이상이어야 합니다.`,
        },
        { status: 400 }
      );
    }

    // 이메일 소문자 정규화 (대소문자 구분 없이 동일 계정으로 처리)
    const normalizedEmail: string = email.toLowerCase();

    // INSERT 전 이메일 존재 여부 사전 확인
    // unique 제약 조건 에러(23505)로 탈퇴/활성 계정을 구분할 수 없으므로 명시적으로 처리
    const existingUser = await pool.query<{ id: number; is_deleted: boolean }>(
      "SELECT id, is_deleted FROM users WHERE email = $1",
      [normalizedEmail]
    );
    if (existingUser.rows.length > 0) {
      if (existingUser.rows[0].is_deleted) {
        // 탈퇴한 계정의 이메일: 재가입 불가
        return Response.json(
          { message: "이미 탈퇴한 계정의 이메일입니다. 해당 이메일로는 재가입할 수 없습니다." },
          { status: 409 }
        );
      }
      // 활성 중인 계정의 이메일: 일반 중복 처리
      return Response.json(
        { message: "이미 사용 중인 이메일입니다." },
        { status: 409 }
      );
    }

    // bcryptjs로 비밀번호 해시 (평문 비밀번호는 저장하지 않음)
    const hashedPassword: string = await bcrypt.hash(password, SALT_ROUNDS);

    // DB에 새 사용자 INSERT
    const result = await pool.query<{ id: number }>(
      `INSERT INTO users (name, phone, email, password)
       VALUES ($1, $2, $3, $4)
       RETURNING id`,
      [name, phone, normalizedEmail, hashedPassword]
    );

    // INSERT 결과에서 생성된 사용자 id 추출
    const newUserId: number = result.rows[0].id;

    // JWT_SECRET 환경변수 확인
    const jwtSecret: string = process.env.JWT_SECRET ?? "";
    if (!jwtSecret) {
      console.error("JWT_SECRET 환경변수가 설정되지 않았습니다.");
      return Response.json(
        { message: "서버 설정 오류가 발생했습니다." },
        { status: 500 }
      );
    }

    // 회원가입 즉시 JWT 토큰 생성 (자동 로그인)
    // 신규 가입자는 항상 role='user', isActive=true
    const token: string = jwt.sign(
      {
        userId: String(newUserId),
        email: normalizedEmail,
        role: "user",
        isActive: true,
      },
      jwtSecret,
      { expiresIn: JWT_EXPIRES_IN }
    );

    // 성공 응답 생성 (비밀번호는 응답에서 제외)
    const response = NextResponse.json(
      { message: "회원가입이 완료되었습니다.", userId: newUserId },
      { status: 201 }
    );

    // HttpOnly 쿠키에 토큰 저장 (login/route.ts와 동일한 설정)
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
    // PostgreSQL unique 제약 조건 위반 (이메일 중복)
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      (error as { code: string }).code === "23505"
    ) {
      return Response.json(
        { message: "이미 사용 중인 이메일입니다." },
        { status: 409 }
      );
    }

    // 예상치 못한 서버 오류 처리
    console.error("회원가입 처리 중 오류 발생:", error);
    return Response.json(
      { message: "서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요." },
      { status: 500 }
    );
  }
}
