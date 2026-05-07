import { NextRequest } from "next/server";
import bcrypt from "bcryptjs";
import pool from "@/lib/db";

// 비밀번호 해시에 사용할 salt 라운드 수 (높을수록 보안 강화, 느려짐)
const SALT_ROUNDS = 10;

// 이메일 형식 검증 정규식
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// 비밀번호 최소 길이
const MIN_PASSWORD_LENGTH = 8;

// POST /api/auth/register — 신규 사용자 회원가입 처리
export async function POST(request: NextRequest): Promise<Response> {
  try {
    // 요청 본문에서 이름, 이메일, 비밀번호 추출
    const body: { name: string; email: string; password: string } =
      await request.json();
    const { name, email, password } = body;

    // 이름, 이메일, 비밀번호 필수값 검증
    if (!name || !email || !password) {
      return Response.json(
        { message: "이름, 이메일, 비밀번호를 모두 입력해주세요." },
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

    // bcryptjs로 비밀번호 해시 (평문 비밀번호는 저장하지 않음)
    const hashedPassword: string = await bcrypt.hash(password, SALT_ROUNDS);

    // DB에 새 사용자 INSERT (이메일 중복 시 unique 제약 조건 오류 발생)
    const result = await pool.query<{ id: number }>(
      `INSERT INTO users (name, email, password)
       VALUES ($1, $2, $3)
       RETURNING id`,
      [name, normalizedEmail, hashedPassword]
    );

    // INSERT 결과에서 생성된 사용자 id 추출
    const newUserId: number = result.rows[0].id;

    // 성공 응답 (비밀번호는 응답에서 제외)
    return Response.json(
      { message: "회원가입이 완료되었습니다.", userId: newUserId },
      { status: 201 }
    );
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
