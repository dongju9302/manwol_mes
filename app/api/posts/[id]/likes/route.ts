import { NextRequest } from "next/server";
import pool from "@/lib/db";
import { verifyAuth } from "@/lib/auth";

// 좋아요/싫어요 구분 타입
type LikeType = "like" | "dislike";

// DB에서 조회한 좋아요 행 타입
interface LikeRow {
  // 좋아요 레코드 id
  id: number;
  // 현재 등록된 반응 타입
  type: LikeType;
}

// POST /api/posts/[id]/likes — 좋아요/싫어요 토글 (로그인한 사용자만 가능)
// 동일 타입 재클릭: 취소(DELETE)
// 다른 타입 클릭: 변경(UPDATE)
// 미등록 상태 클릭: 등록(INSERT)
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<Response> {
  // JWT 쿠키 검증
  const authUser = verifyAuth(request);
  if (!authUser) {
    return Response.json(
      { message: "로그인이 필요합니다." },
      { status: 401 }
    );
  }

  const { id } = await params;
  const postId = parseInt(id, 10);

  if (isNaN(postId)) {
    return Response.json(
      { message: "올바르지 않은 게시글 ID입니다." },
      { status: 400 }
    );
  }

  try {
    // 요청 본문에서 반응 타입 추출
    const body: { type: LikeType } = await request.json();
    const { type } = body;

    // type 값 검증
    if (type !== "like" && type !== "dislike") {
      return Response.json(
        { message: 'type은 "like" 또는 "dislike"이어야 합니다.' },
        { status: 400 }
      );
    }

    // 게시글 존재 여부 확인
    const postCheck = await pool.query(
      "SELECT id FROM posts WHERE id = $1",
      [postId]
    );
    if (postCheck.rows.length === 0) {
      return Response.json(
        { message: "게시글을 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    // 해당 사용자의 기존 반응 조회 (UNIQUE(post_id, user_id) 제약으로 최대 1건)
    const existing = await pool.query<LikeRow>(
      "SELECT id, type FROM post_likes WHERE post_id = $1 AND user_id = $2",
      [postId, authUser.userId]
    );

    if (existing.rows.length > 0) {
      const existingLike = existing.rows[0];

      if (existingLike.type === type) {
        // 같은 타입 재클릭 → 취소 (토글 오프)
        await pool.query("DELETE FROM post_likes WHERE id = $1", [existingLike.id]);
        return Response.json(
          { message: `${type === "like" ? "좋아요" : "싫어요"}가 취소되었습니다.` },
          { status: 200 }
        );
      } else {
        // 다른 타입 클릭 → 반응 변경
        await pool.query(
          "UPDATE post_likes SET type = $1 WHERE id = $2",
          [type, existingLike.id]
        );
        return Response.json(
          { message: `${type === "like" ? "좋아요" : "싫어요"}로 변경되었습니다.` },
          { status: 200 }
        );
      }
    } else {
      // 기존 반응 없음 → 신규 등록
      await pool.query(
        "INSERT INTO post_likes (post_id, user_id, type) VALUES ($1, $2, $3)",
        [postId, authUser.userId, type]
      );
      return Response.json(
        { message: `${type === "like" ? "좋아요" : "싫어요"}가 등록되었습니다.` },
        { status: 201 }
      );
    }
  } catch (error) {
    console.error("좋아요/싫어요 처리 중 오류 발생:", error);
    return Response.json(
      { message: "서버 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
