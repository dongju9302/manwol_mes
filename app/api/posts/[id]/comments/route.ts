import { NextRequest } from "next/server";
import pool from "@/lib/db";
import { verifyAuth } from "@/lib/auth";

// DB에서 조회한 댓글 행 타입
interface CommentRow {
  // 댓글 고유 식별자
  id: number;
  // 소속 게시글 ID
  post_id: number;
  // 작성자 사용자 ID
  user_id: number;
  // 부모 댓글 ID (null이면 최상위 댓글, 값이 있으면 대댓글)
  parent_id: number | null;
  // 댓글 본문
  content: string;
  // JOIN으로 가져온 작성자 이름
  author_name: string;
  // 작성 시각
  created_at: string;
  // 수정 시각
  updated_at: string;
}

// 대댓글 배열을 포함한 최상위 댓글 타입
interface CommentWithReplies extends CommentRow {
  // 이 댓글에 달린 대댓글 목록
  replies: CommentRow[];
}

// GET /api/posts/[id]/comments — 댓글 목록 조회 (대댓글 중첩 구조 포함)
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

    // 해당 게시글의 전체 댓글 조회 (작성자 이름 포함, 작성 시간 오름차순)
    const result = await pool.query<CommentRow>(
      `SELECT
         c.id,
         c.post_id,
         c.user_id,
         c.parent_id,
         c.content,
         u.name AS author_name,
         c.created_at,
         c.updated_at
       FROM comments c
       JOIN users u ON c.user_id = u.id
       WHERE c.post_id = $1
       ORDER BY c.created_at ASC`,
      [postId]
    );

    // 최상위 댓글과 대댓글을 분리해 중첩 구조로 재구성
    const parentComments: CommentWithReplies[] = [];
    // key: 부모 댓글 id, value: 대댓글 배열
    const replyMap = new Map<number, CommentRow[]>();

    for (const comment of result.rows) {
      if (comment.parent_id === null) {
        // 최상위 댓글: replies 배열 초기화
        parentComments.push({ ...comment, replies: [] });
      } else {
        // 대댓글: 부모 id 기준으로 그룹화
        if (!replyMap.has(comment.parent_id)) {
          replyMap.set(comment.parent_id, []);
        }
        replyMap.get(comment.parent_id)!.push(comment);
      }
    }

    // 각 최상위 댓글에 대댓글 배열 연결
    for (const comment of parentComments) {
      comment.replies = replyMap.get(comment.id) ?? [];
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
    // parent_id가 있으면 대댓글, 없으면 최상위 댓글
    const body: { content: string; parent_id?: number } = await request.json();
    const { content, parent_id } = body;

    if (!content) {
      return Response.json(
        { message: "댓글 내용을 입력해주세요." },
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

    // 대댓글인 경우 부모 댓글이 같은 게시글에 속하는지 확인
    if (parent_id !== undefined) {
      const parentCheck = await pool.query(
        "SELECT id FROM comments WHERE id = $1 AND post_id = $2",
        [parent_id, postId]
      );
      if (parentCheck.rows.length === 0) {
        return Response.json(
          { message: "부모 댓글을 찾을 수 없습니다." },
          { status: 404 }
        );
      }
    }

    // 댓글 INSERT (parent_id 없으면 null 저장 → 최상위 댓글)
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
