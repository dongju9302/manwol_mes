import { NextRequest } from "next/server";
import { verifyAuth } from "@/lib/auth";
import pool from "@/lib/db";

// DB에서 조회할 사용자 행 타입
interface UserRow {
  name: string;
  role: string;
}

// GET /api/auth/me — 현재 로그인된 사용자 정보 반환
// Header·LayoutProvider 등 클라이언트 컴포넌트에서 사용자 데이터를 조회할 때 사용
export async function GET(request: NextRequest): Promise<Response> {
  // JWT 쿠키에서 사용자 인증 정보 추출
  const authUser = verifyAuth(request);

  // 미인증 상태: user: null 반환 (401은 반환하지 않아 Header가 조용히 처리할 수 있도록)
  if (!authUser) {
    return Response.json({ user: null }, { status: 200 });
  }

  try {
    // DB에서 최신 이름·역할 조회 (JWT 페이로드보다 DB 값 우선)
    const result = await pool.query<UserRow>(
      "SELECT name, role FROM users WHERE id = $1",
      [authUser.userId]
    );

    const user = result.rows[0];
    if (!user) {
      return Response.json({ user: null }, { status: 200 });
    }

    return Response.json({
      user: {
        name: user.name,
        role: user.role,
        email: authUser.email,
      },
    });
  } catch (error) {
    // DB 오류 시 JWT 기반 정보로 폴백
    console.error("사용자 정보 조회 오류:", error);
    return Response.json({
      user: {
        name: "",
        role: authUser.role,
        email: authUser.email,
      },
    });
  }
}
