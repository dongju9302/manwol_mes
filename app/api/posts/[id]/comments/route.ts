import { NextRequest } from "next/server";
import pool from "@/lib/db";
import { verifyAuth } from "@/lib/auth";

// DB에서 조회한 댓글 행 타입 (is_deleted 포함)
interface CommentRow {
  id: number;
  post_id: number;
  user_id: number;
  parent_id: number | null;
  content: string;
  // is_deleted: 부모 댓글의 논리 삭제 여부 (대댓글에는 false만 반환)
  is_deleted: boolean;
  author_name: string;
  created_at: string;
  updated_at: string;
}

// 대댓글 배열을 포함한 최상위 댓글 타입
interface CommentWithReplies extends CommentRow {
  replies: CommentRow[];
}

// GET /api/posts/[id]/comments — 댓글 목록 조회 (대댓글 중첩 구조 포함)
// Soft Delete 표시 전략:
//   - 대댓글이 있는 삭제된 댓글: is_deleted=true 상태로 포함 → 프론트에서 "삭제된 댓글입니다" 표시
//   - 대댓글이 없는 삭제된 댓글: 응답에서 제외
//   - 삭제된 대댓글(replies): 항상 제외
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<Response> {
  const { id } = await params;
  const postId = parseInt(id, 10);

  if (isNaN(postId)) {
    return Response.json(
      { message: "올바르지 않은 게시글 ID입니다." },
      { status: 400 }
    );
  }

  try {
    // 게시글 존재 여부 확인 (soft delete된 게시글 제외)
    const postCheck = await pool.query(
      "SELECT id FROM posts WHERE id = $1 AND is_deleted = false",
      [postId]
    );
    if (postCheck.rows.length === 0) {
      return Response.json(
        { message: "게시글을 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    // 전체 댓글 조회 (is_deleted 포함, 삭제된 댓글도 가져옴)
    // 삭제 여부 필터링은 아래 JS 코드에서 대댓글 유무를 확인 후 처리
    const result = await pool.query<CommentRow>(
      `SELECT
         c.id,
         c.post_id,
         c.user_id,
         c.parent_id,
         c.content,
         c.is_deleted,
         u.name AS author_name,
         c.created_at::text AS created_at,
         c.updated_at::text AS updated_at
       FROM comments c
       JOIN users u ON c.user_id = u.id
       WHERE c.post_id = $1
       ORDER BY c.created_at ASC`,
      [postId]
    );

    // ── 분류 단계 ─────────────────────────────────────────────
    // 활성 대댓글(is_deleted=false, parent_id != null)만 replyMap에 수집
    const replyMap = new Map<number, CommentRow[]>();
    for (const comment of result.rows) {
      if (comment.parent_id !== null && !comment.is_deleted) {
        if (!replyMap.has(comment.parent_id)) {
          replyMap.set(comment.parent_id, []);
        }
        replyMap.get(comment.parent_id)!.push(comment);
      }
    }

    // ── 최상위 댓글 필터링 ────────────────────────────────────
    // 포함 조건: is_deleted=false 이거나, is_deleted=true이고 활성 대댓글이 있는 경우
    // 제외 조건: is_deleted=true이고 활성 대댓글이 없는 경우
    const parentComments: CommentWithReplies[] = [];
    for (const comment of result.rows) {
      if (comment.parent_id !== null) continue; // 대댓글은 건너뜀

      const hasActiveReplies = (replyMap.get(comment.id)?.length ?? 0) > 0;

      if (!comment.is_deleted || hasActiveReplies) {
        // 활성 댓글 또는 (삭제됐지만 대댓글 있는) 댓글을 목록에 추가
        parentComments.push({
          ...comment,
          replies: replyMap.get(comment.id) ?? [],
        });
      }
      // is_deleted=true이고 대댓글도 없는 경우: 목록에서 완전히 제외
    }

    return Response.json({ comments: parentComments }, { status: 200 });
  } catch (error) {
    console.error("댓글 목록 조회 중 오류 발생:", error);
    return Response.json(
      { message: "서버 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}

// POST /api/posts/[id]/comments — 댓글/대댓글 작성 (로그인한 사용자만 가능)
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<Response> {
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
    const body: { content: string; parent_id?: number } = await request.json();
    const { content, parent_id } = body;

    if (!content) {
      return Response.json(
        { message: "댓글 내용을 입력해주세요." },
        { status: 400 }
      );
    }

    // 게시글 존재 여부 확인 (soft delete된 게시글에는 댓글 작성 불가)
    const postCheck = await pool.query(
      "SELECT id FROM posts WHERE id = $1 AND is_deleted = false",
      [postId]
    );
    if (postCheck.rows.length === 0) {
      return Response.json(
        { message: "게시글을 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    // 대댓글인 경우: 부모 댓글이 같은 게시글에 속하고 삭제되지 않았는지 확인
    if (parent_id !== undefined) {
      const parentCheck = await pool.query(
        "SELECT id FROM comments WHERE id = $1 AND post_id = $2 AND is_deleted = false",
        [parent_id, postId]
      );
      if (parentCheck.rows.length === 0) {
        return Response.json(
          { message: "부모 댓글을 찾을 수 없습니다." },
          { status: 404 }
        );
      }
    }

    // 댓글 INSERT (parent_id 없으면 null → 최상위 댓글)
    const result = await pool.query<{ id: number }>(
      `INSERT INTO comments (post_id, user_id, parent_id, content)
       VALUES ($1, $2, $3, $4)
       RETURNING id`,
      [postId, authUser.userId, parent_id ?? null, content]
    );

    const newCommentId: number = result.rows[0].id;
    return Response.json(
      { message: "댓글이 작성되었습니다.", commentId: newCommentId },
      { status: 201 }
    );
  } catch (error) {
    console.error("댓글 작성 중 오류 발생:", error);
    return Response.json(
      { message: "서버 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
