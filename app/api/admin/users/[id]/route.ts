import { NextRequest } from "next/server";
import { verifyAuth } from "@/lib/auth";
import pool from "@/lib/db";

// 유효한 역할 목록
const VALID_ROLES = ["master", "admin", "user"] as const;
type Role = (typeof VALID_ROLES)[number];

// master 역할 검증 헬퍼 — 권한 없으면 Response 반환, 통과 시 null
function requireMaster(
  request: NextRequest
): { error: Response } | { authUserId: number } {
  const authUser = verifyAuth(request);
  if (!authUser) {
    return {
      error: Response.json(
        { message: "로그인이 필요합니다." },
        { status: 401 }
      ),
    };
  }
  if (authUser.role !== "master") {
    return {
      error: Response.json(
        { message: "접근 권한이 없습니다." },
        { status: 403 }
      ),
    };
  }
  return { authUserId: authUser.userId };
}

// PATCH /api/admin/users/[id] — 역할 또는 활성화 상태 수정 (master 전용)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<Response> {
  // master 권한 확인
  const guard = requireMaster(request);
  if ("error" in guard) return guard.error;

  const { id } = await params;
  const targetId = parseInt(id, 10);

  // 유효하지 않은 id 형식
  if (isNaN(targetId)) {
    return Response.json({ message: "잘못된 사용자 ID입니다." }, { status: 400 });
  }

  // 요청 본문 파싱
  const body: { role?: string; isActive?: boolean } = await request.json();
  const { role, isActive } = body;

  // role과 isActive 중 하나 이상 필요
  if (role === undefined && isActive === undefined) {
    return Response.json(
      { message: "수정할 항목(role 또는 isActive)을 입력해주세요." },
      { status: 400 }
    );
  }

  // role 유효성 검증
  if (role !== undefined && !VALID_ROLES.includes(role as Role)) {
    return Response.json(
      { message: "유효하지 않은 역할입니다. (master | admin | user)" },
      { status: 400 }
    );
  }

  try {
    // 동적으로 UPDATE SET 절 구성 (변경 항목만 업데이트)
    const setClauses: string[] = [];
    const values: unknown[] = [];
    let paramIndex = 1;

    if (role !== undefined) {
      setClauses.push(`role = $${paramIndex++}`);
      values.push(role);
    }
    if (isActive !== undefined) {
      setClauses.push(`is_active = $${paramIndex++}`);
      values.push(isActive);
    }

    // 대상 사용자 ID를 마지막 파라미터로 추가
    values.push(targetId);

    // is_deleted = false: soft delete(탈퇴)된 계정은 수정 불가
    const result = await pool.query(
      `UPDATE users SET ${setClauses.join(", ")} WHERE id = $${paramIndex} AND is_deleted = false RETURNING id`,
      values
    );

    // 해당 ID의 사용자가 없거나 이미 탈퇴한 경우
    if (result.rows.length === 0) {
      return Response.json(
        { message: "사용자를 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    return Response.json({ message: "수정 완료" }, { status: 200 });
  } catch (error) {
    console.error("사용자 수정 중 오류 발생:", error);
    return Response.json(
      { message: "서버 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/users/[id] — 계정 Soft Delete (master 전용, 자기 자신 삭제 불가)
// 실제 행 삭제 대신 is_deleted = true, deleted_at = NOW() 로 논리 삭제 처리
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<Response> {
  // master 권한 확인
  const guard = requireMaster(request);
  if ("error" in guard) return guard.error;
  const { authUserId } = guard;

  const { id } = await params;
  const targetId = parseInt(id, 10);

  if (isNaN(targetId)) {
    return Response.json({ message: "잘못된 사용자 ID입니다." }, { status: 400 });
  }

  // 자기 자신 삭제 방지
  if (targetId === authUserId) {
    return Response.json(
      { message: "자기 자신의 계정은 삭제할 수 없습니다." },
      { status: 400 }
    );
  }

  try {
    // Soft Delete: 실제 행 삭제 없이 삭제 플래그만 업데이트
    // is_deleted = false 조건: 이미 탈퇴한 계정은 처리 대상에서 제외
    const result = await pool.query(
      "UPDATE users SET is_deleted = true, deleted_at = NOW() WHERE id = $1 AND is_deleted = false RETURNING id",
      [targetId]
    );

    // 대상 계정이 없거나 이미 탈퇴된 경우
    if (result.rows.length === 0) {
      return Response.json(
        { message: "사용자를 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    return Response.json({ message: "삭제 완료" }, { status: 200 });
  } catch (error) {
    console.error("사용자 삭제 중 오류 발생:", error);
    return Response.json(
      { message: "서버 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
