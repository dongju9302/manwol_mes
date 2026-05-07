import { NextRequest } from "next/server";
import pool from "@/lib/db";
import { verifyAuth } from "@/lib/auth";

// DB에서 조회한 게시글 상세 행 타입
interface PostDetailRow {
  // 게시글 고유 식별자
  id: number;
  // 게시글 제목
  title: string;
  // 게시글 본문
  content: string;
  // 작성자 사용자 ID
  user_id: number;
  // JOIN으로 가져온 작성자 이름
  author_name: string;
  // COUNT는 pg에서 문자열로 반환되므로 string 타입
  like_count: string;
  // 싫어요 수 (문자열)
  dislike_count: string;
  // 조회수
  view_count: number;
  // 작성 시각
  created_at: string;
  // 수정 시각
  updated_at: string;
}

// GET /api/posts/[id] — 게시글 상세 조회 (좋아요/싫어요 수 포함)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<Response> {
  // params는 Promise이므로 await 필요 (Next.js 15+ 변경사항)
  const { id } = await params;
  const postId = parseInt(id, 10);

  // 숫자가 아닌 id 요청 차단
  if (isNaN(postId)) {
    return Response.json(
      { message: "올바르지 않은 게시글 ID입니다." },
      { status: 400 }
    );
  }

  try {
    // [디버그] 이 GET API는 수정(edit) 페이지에서만 호출됨
    // 실제 조회수 증가는 서버 컴포넌트(board/[id]/page.tsx)에서 처리
    console.log(`[GET /api/posts/${postId}] 호출 — 수정 페이지용, view_count 미증가`);

    // 게시글 + 작성자 + 좋아요/싫어요 수 + 조회수를 한 번의 쿼리로 조회
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
       WHERE p.id = $1
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
          // pg COUNT 결과(문자열)를 정수로 변환
          like_count: parseInt(post.like_count, 10),
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
    // 게시글 존재 여부 및 작성자 확인
    const postResult = await pool.query<{ user_id: number }>(
      "SELECT user_id FROM posts WHERE id = $1",
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

    // 요청 본문에서 수정할 필드 추출 (둘 다 선택사항)
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

    // COALESCE: 값이 null이면 기존 컬럼 값 유지 (입력되지 않은 필드는 변경 안 함)
    await pool.query(
      `UPDATE posts
       SET
         title      = COALESCE($1, title),
         content    = COALESCE($2, content),
         updated_at = NOW()
       WHERE id = $3`,
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

// DELETE /api/posts/[id] — 게시글 삭제 (작성자 본인만 가능)
export async function DELETE(
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
    // 게시글 존재 여부 및 작성자 확인
    const postResult = await pool.query<{ user_id: number }>(
      "SELECT user_id FROM posts WHERE id = $1",
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

    // 게시글 삭제 (ON DELETE CASCADE로 comments, post_likes도 자동 삭제)
    await pool.query("DELETE FROM posts WHERE id = $1", [postId]);

    return Response.json({ message: "게시글이 삭제되었습니다." }, { status: 200 });
  } catch (error) {
    console.error("게시글 삭제 중 오류 발생:", error);
    return Response.json(
      { message: "서버 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
