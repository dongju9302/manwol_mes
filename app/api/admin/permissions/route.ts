import { NextRequest } from "next/server";
import { verifyAuth } from "@/lib/auth";
import pool from "@/lib/db";

// page_permissions 테이블 행 타입
interface PermissionRow {
  id: number;
  page_path: string;
  page_name: string;
  admin_access: boolean;
  user_access: boolean;
  created_at: string;
}

// master 권한 검증 헬퍼
function requireMaster(request: NextRequest): Response | null {
  const authUser = verifyAuth(request);
  if (!authUser) {
    return Response.json({ message: "로그인이 필요합니다." }, { status: 401 });
  }
  if (authUser.role !== "master") {
    return Response.json({ message: "접근 권한이 없습니다." }, { status: 403 });
  }
  return null;
}

// GET /api/admin/permissions — 페이지 권한 목록 조회 (master 전용)
export async function GET(request: NextRequest): Promise<Response> {
  const guardResult = requireMaster(request);
  if (guardResult) return guardResult;

  try {
    // 페이지 경로 오름차순 정렬
    const result = await pool.query<PermissionRow>(
      `SELECT id, page_path, page_name, admin_access, user_access, created_at::text
       FROM page_permissions
       ORDER BY page_path ASC`
    );

    return Response.json({ permissions: result.rows }, { status: 200 });
  } catch (error) {
    console.error("권한 목록 조회 중 오류 발생:", error);
    return Response.json(
      { message: "서버 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}

// PATCH /api/admin/permissions — 특정 페이지 권한 수정 (master 전용)
export async function PATCH(request: NextRequest): Promise<Response> {
  const guardResult = requireMaster(request);
  if (guardResult) return guardResult;

  try {
    // 요청 본문 파싱: id + 변경할 권한 항목
    const body: {
      id: number;
      adminAccess?: boolean;
      userAccess?: boolean;
    } = await request.json();
    const { id, adminAccess, userAccess } = body;

    // 권한 레코드 ID 필수값 검증
    if (!id || isNaN(Number(id))) {
      return Response.json(
        { message: "권한 ID가 필요합니다." },
        { status: 400 }
      );
    }

    // adminAccess 또는 userAccess 중 하나 이상 필요
    if (adminAccess === undefined && userAccess === undefined) {
      return Response.json(
        { message: "수정할 권한 항목을 입력해주세요." },
        { status: 400 }
      );
    }

    // 동적 UPDATE SET 절 구성 (변경된 항목만 업데이트)
    const setClauses: string[] = [];
    const values: unknown[] = [];
    let paramIndex = 1;

    if (adminAccess !== undefined) {
      setClauses.push(`admin_access = $${paramIndex++}`);
      values.push(adminAccess);
    }
    if (userAccess !== undefined) {
      setClauses.push(`user_access = $${paramIndex++}`);
      values.push(userAccess);
    }

    values.push(id);

    const result = await pool.query(
      `UPDATE page_permissions SET ${setClauses.join(", ")} WHERE id = $${paramIndex} RETURNING id`,
      values
    );

    if (result.rows.length === 0) {
      return Response.json(
        { message: "권한 레코드를 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    return Response.json({ message: "권한 수정 완료" }, { status: 200 });
  } catch (error) {
    console.error("권한 수정 중 오류 발생:", error);
    return Response.json(
      { message: "서버 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
