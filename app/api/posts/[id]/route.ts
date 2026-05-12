import { NextRequest } from "next/server";
import pool from "@/lib/db";
import { verifyAuth } from "@/lib/auth";

// DB에서 조회한 게시글 상세 행 타입
interface PostDetailRow {
  id: number;
  title: string;
  content: string;
  user_id: number;
  author_name: string;
  // COUNT는 pg에서 문자열로 반환
  like_count: string;
  dislike_count: string;
  view_count: number;
  created_at: string;
  updated_at: string;
}

// GET /api/posts/[id] — 게시글 상세 조회 (수정 페이지에서 기존 내용 로드용)
export async function GET(
  request: NextRequest,
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
    // is_deleted = false: soft delete된 게시글은 조회 불가
    const result = await pool.query<PostDetailRow>(
      `SELECT
         p.id,
         p.title,
         p.content,
         p.user_id,
         u.name AS author_name,
         COUNT(CASE WHEN pl.type = 'like'    THEN 1 END) AS like_count,
         COUNT(CASE WHEN pl.type = 'dislike' THEN 1 END) AS dislike_count,
         p.view_count,
         p.created_at,
         p.updated_at
       FROM posts p
       JOIN users u ON p.user_id = u.id
       LEFT JOIN post_likes pl ON p.id = pl.post_id
       WHERE p.id = $1 AND p.is_deleted = false
       GROUP BY p.id, u.id`,
      [postId]
    );

    if (result.rows.length === 0) {
      return Response.json(
        { message: "게시글을 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    const post = result.rows[0];
    return Response.json(
      {
        post: {
          ...post,
          like_count:    parseInt(post.like_count, 10),
          dislike_count: parseInt(post.dislike_count, 10),
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("게시글 상세 조회 중 오류 발생:", error);
    return Response.json(
      { message: "서버 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}

// PUT /api/posts/[id] — 게시글 수정 (작성자 본인만 가능)
export async function PUT(
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
    // is_deleted = false: soft delete된 게시글은 수정 불가
    const postResult = await pool.query<{ user_id: number }>(
      "SELECT user_id FROM posts WHERE id = $1 AND is_deleted = false",
      [postId]
    );

    if (postResult.rows.length === 0) {
      return Response.json(
        { message: "게시글을 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    // 작성자 본인 여부 확인 (다른 사용자 수정 차단)
    if (postResult.rows[0].user_id !== authUser.userId) {
      return Response.json(
        { message: "수정 권한이 없습니다." },
        { status: 403 }
      );
    }

    const body: { title?: string; content?: string } = await request.json();
    const { title, content } = body;

    if (!title && !content) {
      return Response.json(
        { message: "수정할 내용을 입력해주세요." },
        { status: 400 }
      );
    }

    if (title && title.length > 255) {
      return Response.json(
        { message: "제목은 255자 이하로 입력해주세요." },
        { status: 400 }
      );
    }

    // COALESCE: 값이 null이면 기존 컬럼 값 유지
    await pool.query(
      `UPDATE posts
       SET title = COALESCE($1, title), content = COALESCE($2, content), updated_at = NOW()
       WHERE id = $3 AND is_deleted = false`,
      [title ?? null, content ?? null, postId]
    );

    return Response.json({ message: "게시글이 수정되었습니다." }, { status: 200 });
  } catch (error) {
    console.error("게시글 수정 중 오류 발생:", error);
    return Response.json(
      { message: "서버 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}

// DELETE /api/posts/[id] — 게시글 Soft Delete (작성자 본인만 가능)
// 실제 행 삭제 대신 is_deleted = true, deleted_at = NOW() 로 논리 삭제 처리
export async function DELETE(
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
    // is_deleted = false: 이미 삭제된 게시글은 처리 대상에서 제외
    const postResult = await pool.query<{ user_id: number }>(
      "SELECT user_id FROM posts WHERE id = $1 AND is_deleted = false",
      [postId]
    );

    if (postResult.rows.length === 0) {
      return Response.json(
        { message: "게시글을 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    // 작성자 본인 여부 확인
    if (postResult.rows[0].user_id !== authUser.userId) {
      return Response.json(
        { message: "삭제 권한이 없습니다." },
        { status: 403 }
      );
    }

    // Soft Delete: 실제 행 삭제 없이 삭제 플래그만 업데이트
    await pool.query(
      "UPDATE posts SET is_deleted = true, deleted_at = NOW() WHERE id = $1",
      [postId]
    );

    return Response.json({ message: "게시글이 삭제되었습니다." }, { status: 200 });
  } catch (error) {
    console.error("게시글 삭제 중 오류 발생:", error);
    return Response.json(
      { message: "서버 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
