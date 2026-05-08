import { NextRequest } from "next/server";
import pool from "@/lib/db";

// 이메일 형식 검증 정규식 (register/route.ts와 동일)
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// GET /api/auth/check-email?email=xxx — 이메일 중복 여부 확인
// 응답: { available: true } 사용 가능 / { available: false } 중복
export async function GET(request: NextRequest): Promise<Response> {
  // 쿼리 파라미터에서 email 추출
  const email = request.nextUrl.searchParams.get("email");

  // 이메일 파라미터 누락 시 400
  if (!email) {
    return Response.json(
      { message: "이메일을 입력해주세요." },
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

  // 소문자 정규화 (register/route.ts와 동일한 기준)
  const normalizedEmail: string = email.toLowerCase();

  try {
    // DB에서 동일 이메일의 활성 계정 존재 여부 조회
    // is_deleted = false: soft delete(탈퇴)된 계정은 중복으로 판단하지 않음
    // 단, 탈퇴 계정 이메일로 재가입 시 register/route.ts에서 별도 차단 처리됨
    const result = await pool.query<{ id: number }>(
      "SELECT id FROM users WHERE email = $1 AND is_deleted = false",
      [normalizedEmail]
    );

    // 행이 있으면 중복, 없으면 사용 가능
    const available: boolean = result.rows.length === 0;
    return Response.json({ available }, { status: 200 });
  } catch (error) {
    // 예상치 못한 DB 오류
    console.error("이메일 중복 확인 중 오류 발생:", error);
    return Response.json(
      { message: "서버 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
