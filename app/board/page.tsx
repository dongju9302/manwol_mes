import { redirect } from "next/navigation";
import Link from "next/link";
import pool from "@/lib/db";
import { verifyAuthFromCookies } from "@/lib/auth";
import BoardFilter, { type Post } from "./_components/BoardFilter";

// DB에서 조회한 게시글 목록 행 타입
interface PostListRow extends Post {
  // Post 타입을 확장 — DB 쿼리 결과와 동일한 구조
}

// 게시판 목록 페이지 — 서버 컴포넌트 (DB 직접 조회)
export default async function BoardPage() {
  // 로그인 여부 확인: 미로그인 시 /login으로 리다이렉트
  const authUser = await verifyAuthFromCookies();
  if (!authUser) {
    redirect("/login");
  }

  // 게시글 목록 조회: 작성자 이름 JOIN, 좋아요·싫어요·조회수 포함, 최신순 정렬
  // user_id 포함 — 클라이언트에서 "내글만" 필터 판별에 사용
  const result = await pool.query<PostListRow>(`
    SELECT
      p.id,
      p.user_id,
      p.title,
      u.name                                               AS author_name,
      p.view_count,
      COUNT(CASE WHEN pl.type = 'like'    THEN 1 END)     AS like_count,
      COUNT(CASE WHEN pl.type = 'dislike' THEN 1 END)     AS dislike_count,
      p.created_at::text                                   AS created_at
    FROM posts p
    JOIN users u ON p.user_id = u.id
    LEFT JOIN post_likes pl ON p.id = pl.post_id
    GROUP BY p.id, u.name
    ORDER BY p.created_at DESC
  `);

  return (
    // 전체 배경
    <div className="min-h-screen bg-gray-50">
      {/* admin/page.tsx와 동일한 컨테이너 크기·패딩 적용 */}
      <div className="mx-auto max-w-5xl px-4 py-6 md:py-8">
        {/* 페이지 헤더: 제목 + 글쓰기 버튼 */}
        <div className="mb-6 flex items-center justify-between">
          {/* 모바일: 햄버거 버튼(왼쪽 고정) 공간 확보를 위해 pl-12 */}
          <h1 className="pl-12 text-xl font-bold text-gray-800 md:pl-0 md:text-2xl">
            게시판
          </h1>
          {/* 글쓰기 버튼: 최소 높이 44px (터치 친화적) */}
          <Link
            href="/board/write"
            className="flex min-h-[44px] items-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
          >
            글쓰기
          </Link>
        </div>

        {/* 필터 버튼 + 게시글 테이블 (클라이언트 컴포넌트) */}
        <BoardFilter
          posts={result.rows}
          currentUserId={authUser.userId}
        />
      </div>
    </div>
  );
}
