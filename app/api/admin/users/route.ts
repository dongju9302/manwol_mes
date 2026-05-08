import { NextRequest } from "next/server";
import { verifyAuth } from "@/lib/auth";
import pool from "@/lib/db";

// DB에서 조회한 사용자 행 타입
interface UserRow {
  id: number;
  name: string;
  email: string;
  role: string;
  is_active: boolean;
  created_at: string;
}

// master 역할 검증 헬퍼 — 권한 없으면 403 Response 반환
function requireMaster(request: NextRequest): Response | null {
  const authUser = verifyAuth(request);
  if (!authUser) {
    return Response.json({ message: "로그인이 필요합니다." }, { status: 401 });
  }
  if (authUser.role !== "master") {
    return Response.json({ message: "접근 권한이 없습니다." }, { status: 403 });
  }
  // 권한 통과: null 반환
  return null;
}

// GET /api/admin/users — 전체 사용자 목록 조회 (master 전용)
export async function GET(request: NextRequest): Promise<Response> {
  // master 권한 확인
  const guardResult = requireMaster(request);
  if (guardResult) return guardResult;

  try {
    // 전체 사용자 조회: 최신 가입순 정렬
    // is_deleted = false: soft delete(탈퇴)된 계정 제외
    const result = await pool.query<UserRow>(
      `SELECT id, name, email, role, is_active, created_at::text
       FROM users
       WHERE is_deleted = false
       ORDER BY created_at DESC`
    );

    return Response.json({ users: result.rows }, { status: 200 });
  } catch (error) {
    console.error("사용자 목록 조회 중 오류 발생:", error);
    return Response.json(
      { message: "서버 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
