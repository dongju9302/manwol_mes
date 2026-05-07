import { NextRequest } from "next/server";
import pool from "@/lib/db";
import { verifyAuth } from "@/lib/auth";

// PUT /api/posts/[id]/comments/[commentId] — 댓글 수정 (작성자 본인만 가능)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; commentId: string }> }
): Promise<Response> {
  // JWT 쿠키 검증
  const authUser = verifyAuth(request);
  if (!authUser) {
    return Response.json(
      { message: "로그인이 필요합니다." },
      { status: 401 }
    );
  }

  // params는 Promise이므로 await 필요
  const { id, commentId } = await params;
  const postId = parseInt(id, 10);
  const commentIdNum = parseInt(commentId, 10);

  if (isNaN(postId) || isNaN(commentIdNum)) {
    return Response.json(
      { message: "올바르지 않은 ID입니다." },
      { status: 400 }
    );
  }

  try {
    // 댓글이 해당 게시글에 속하는지 + 작성자 확인 (한 번의 쿼리로 처리)
    const commentResult = await pool.query<{ user_id: number }>(
      "SELECT user_id FROM comments WHERE id = $1 AND post_id = $2",
      [commentIdNum, postId]
    );

    if (commentResult.rows.length === 0) {
      return Response.json(
        { message: "댓글을 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    // 작성자 본인 여부 확인
    if (commentResult.rows[0].user_id !== authUser.userId) {
      return Response.json(
        { message: "수정 권한이 없습니다." },
        { status: 403 }
      );
    }

    // 요청 본문에서 수정할 내용 추출
    const body: { content: string } = await request.json();
    const { content } = body;

    if (!content) {
      return Response.json(
        { message: "수정할 내용을 입력해주세요." },
        { status: 400 }
      );
    }

    // 내용과 수정 시각 업데이트
    await pool.query(
      "UPDATE comments SET content = $1, updated_at = NOW() WHERE id = $2",
      [content, commentIdNum]
    );

    return Response.json({ message: "댓글이 수정되었습니다." }, { status: 200 });
  } catch (error) {
    console.error("댓글 수정 중 오류 발생:", error);
    return Response.json(
      { message: "서버 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}

// DELETE /api/posts/[id]/comments/[commentId] — 댓글 삭제 (작성자 본인만 가능)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; commentId: string }> }
): Promise<Response> {
  // JWT 쿠키 검증
  const authUser = verifyAuth(request);
  if (!authUser) {
    return Response.json(
      { message: "로그인이 필요합니다." },
      { status: 401 }
    );
  }

  const { id, commentId } = await params;
  const postId = parseInt(id, 10);
  const commentIdNum = parseInt(commentId, 10);

  if (isNaN(postId) || isNaN(commentIdNum)) {
    return Response.json(
      { message: "올바르지 않은 ID입니다." },
      { status: 400 }
    );
  }

  try {
    // 댓글 존재 여부 및 작성자 확인
    const commentResult = await pool.query<{ user_id: number }>(
      "SELECT user_id FROM comments WHERE id = $1 AND post_id = $2",
      [commentIdNum, postId]
    );

    if (commentResult.rows.length === 0) {
      return Response.json(
        { message: "댓글을 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    // 작성자 본인 여부 확인
    if (commentResult.rows[0].user_id !== authUser.userId) {
      return Response.json(
        { message: "삭제 권한이 없습니다." },
        { status: 403 }
      );
    }

    // 댓글 삭제 (ON DELETE CASCADE로 대댓글도 자동 삭제)
    await pool.query("DELETE FROM comments WHERE id = $1", [commentIdNum]);

    return Response.json({ message: "댓글이 삭제되었습니다." }, { status: 200 });
  } catch (error) {
    console.error("댓글 삭제 중 오류 발생:", error);
    return Response.json(
      { message: "서버 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
