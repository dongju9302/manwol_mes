import { NextRequest } from "next/server";
import pool from "@/lib/db";
import { verifyAuth } from "@/lib/auth";

// DB에서 조회한 게시글 목록 행 타입
interface PostRow {
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
  // 작성 시각
  created_at: string;
  // 수정 시각
  updated_at: string;
}

// GET /api/posts — 게시글 목록 조회 (최신순, 작성자 이름 포함)
export async function GET(): Promise<Response> {
  try {
    // posts와 users를 JOIN해 작성자 이름 포함, 최신순 정렬
    const result = await pool.query<PostRow>(`
      SELECT
        p.id,
        p.title,
        p.content,
        p.user_id,
        u.name AS author_name,
        p.created_at,
        p.updated_at
      FROM posts p
      JOIN users u ON p.user_id = u.id
      ORDER BY p.created_at DESC
    `);

    return Response.json({ posts: result.rows }, { status: 200 });
  } catch (error) {
    // 예상치 못한 서버 오류 처리
    console.error("게시글 목록 조회 중 오류 발생:", error);
    return Response.json(
      { message: "서버 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}

// POST /api/posts — 게시글 작성 (로그인한 사용자만 가능)
export async function POST(request: NextRequest): Promise<Response> {
  // JWT 쿠키 검증 (미로그인 시 401 반환)
  const authUser = verifyAuth(request);
  if (!authUser) {
    return Response.json(
      { message: "로그인이 필요합니다." },
      { status: 401 }
    );
  }

  try {
    // 요청 본문에서 제목, 내용 추출
    const body: { title: string; content: string } = await request.json();
    const { title, content } = body;

    // 제목, 내용 필수값 검증
    if (!title || !content) {
      return Response.json(
        { message: "제목과 내용을 모두 입력해주세요." },
        { status: 400 }
      );
    }

    // 제목 최대 길이 검증
    if (title.length > 255) {
      return Response.json(
        { message: "제목은 255자 이하로 입력해주세요." },
        { status: 400 }
      );
    }

    // 인증된 사용자 ID로 게시글 INSERT
    const result = await pool.query<{ id: number }>(
      `INSERT INTO posts (user_id, title, content)
       VALUES ($1, $2, $3)
       RETURNING id`,
      [authUser.userId, title, content]
    );

    // INSERT 결과에서 생성된 게시글 id 추출
    const newPostId: number = result.rows[0].id;

    return Response.json(
      { message: "게시글이 작성되었습니다.", postId: newPostId },
      { status: 201 }
    );
  } catch (error) {
    // 예상치 못한 서버 오류 처리
    console.error("게시글 작성 중 오류 발생:", error);
    return Response.json(
      { message: "서버 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
