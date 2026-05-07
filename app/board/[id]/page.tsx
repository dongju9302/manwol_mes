import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import pool from "@/lib/db";
import { verifyAuthFromCookies } from "@/lib/auth";
import LikeButtons from "./_components/LikeButtons";
import CommentSection from "./_components/CommentSection";
import DeleteButton from "./_components/DeleteButton";

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
  created_at: string;
}

// 댓글 행 타입 (CommentSection에 전달하는 구조)
interface CommentRow {
  id: number;
  post_id: number;
  user_id: number;
  parent_id: number | null;
  content: string;
  author_name: string;
  created_at: string;
}

// 대댓글 포함 댓글 타입
interface CommentWithReplies extends CommentRow {
  replies: CommentRow[];
}

// 날짜 문자열을 한국어 형식으로 변환
function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

// 게시글 상세 페이지 — 서버 컴포넌트
// params는 Next.js 15+ 이후 Promise 타입
export default async function PostDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  // params는 Promise이므로 await 필요
  const { id } = await params;
  const postId = parseInt(id, 10);

  // 숫자가 아닌 id: 404 처리
  if (isNaN(postId)) notFound();

  // 로그인 여부 확인: 미로그인 시 /login으로 리다이렉트
  const authUser = await verifyAuthFromCookies();
  if (!authUser) {
    redirect("/login");
  }

  // 게시글 상세 조회 (작성자 이름 JOIN, 좋아요·싫어요 수 집계)
  const postResult = await pool.query<PostDetailRow>(
    `SELECT
       p.id,
       p.title,
       p.content,
       p.user_id,
       u.name                                              AS author_name,
       COUNT(CASE WHEN pl.type = 'like'    THEN 1 END)    AS like_count,
       COUNT(CASE WHEN pl.type = 'dislike' THEN 1 END)    AS dislike_count,
       p.created_at::text                                  AS created_at
     FROM posts p
     JOIN users u ON p.user_id = u.id
     LEFT JOIN post_likes pl ON p.id = pl.post_id
     WHERE p.id = $1
     GROUP BY p.id, u.id`,
    [postId]
  );

  // 게시글이 없으면 404
  if (postResult.rows.length === 0) notFound();

  const post = postResult.rows[0];

  // 현재 사용자의 좋아요/싫어요 상태 조회 (없으면 null)
  const userLikeResult = await pool.query<{ type: string }>(
    "SELECT type FROM post_likes WHERE post_id = $1 AND user_id = $2",
    [postId, authUser.userId]
  );
  const userLikeType = (userLikeResult.rows[0]?.type ?? null) as
    | "like"
    | "dislike"
    | null;

  // 현재 사용자 이름 조회 (CommentSection에서 새 댓글 author_name으로 사용)
  const userNameResult = await pool.query<{ name: string }>(
    "SELECT name FROM users WHERE id = $1",
    [authUser.userId]
  );
  const currentUserName = userNameResult.rows[0]?.name ?? "";

  // 댓글 목록 조회 (작성자 이름 JOIN, 작성 시간 오름차순)
  const commentsResult = await pool.query<CommentRow>(
    `SELECT
       c.id,
       c.post_id,
       c.user_id,
       c.parent_id,
       c.content,
       u.name        AS author_name,
       c.created_at::text AS created_at
     FROM comments c
     JOIN users u ON c.user_id = u.id
     WHERE c.post_id = $1
     ORDER BY c.created_at ASC`,
    [postId]
  );

  // 최상위 댓글과 대댓글 분리 후 중첩 구조 구성
  const parentComments: CommentWithReplies[] = [];
  const replyMap = new Map<number, CommentRow[]>();

  for (const comment of commentsResult.rows) {
    if (comment.parent_id === null) {
      parentComments.push({ ...comment, replies: [] });
    } else {
      if (!replyMap.has(comment.parent_id)) {
        replyMap.set(comment.parent_id, []);
      }
      replyMap.get(comment.parent_id)!.push(comment);
    }
  }

  for (const comment of parentComments) {
    comment.replies = replyMap.get(comment.id) ?? [];
  }

  // 현재 로그인 사용자가 게시글 작성자인지 여부
  const isAuthor = post.user_id === authUser.userId;

  return (
    // 전체 배경
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-3xl px-4 py-8">
        {/* 게시판 목록으로 돌아가기 */}
        <Link
          href="/board"
          className="mb-4 inline-block text-sm text-gray-500 hover:text-blue-600"
        >
          ← 게시판으로
        </Link>

        {/* 게시글 카드 */}
        <div className="mb-6 overflow-hidden rounded-xl bg-white shadow-md">
          {/* 게시글 헤더: 제목 + 메타 정보 + 수정/삭제 버튼 */}
          <div className="border-b border-gray-100 px-8 py-6">
            <h1 className="mb-3 text-2xl font-bold text-gray-800">
              {post.title}
            </h1>
            <div className="flex items-center justify-between">
              {/* 작성자 이름 · 날짜 */}
              <span className="text-sm text-gray-500">
                {post.author_name} · {formatDate(post.created_at)}
              </span>

              {/* 수정/삭제 버튼: 작성자 본인만 표시 */}
              {isAuthor && (
                <div className="flex gap-2">
                  <Link
                    href={`/board/${post.id}/edit`}
                    className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-600 transition-colors hover:bg-gray-50"
                  >
                    수정
                  </Link>
                  {/* 삭제는 fetch 후 리다이렉트가 필요하므로 클라이언트 컴포넌트 사용 */}
                  <DeleteButton postId={post.id} />
                </div>
              )}
            </div>
          </div>

          {/* 게시글 본문 */}
          <div className="px-8 py-6">
            <p className="whitespace-pre-wrap leading-relaxed text-gray-700">
              {post.content}
            </p>
          </div>

          {/* 좋아요/싫어요 영역 */}
          <div className="flex justify-center border-t border-gray-100 px-8 py-5">
            {/* 인터랙션이 필요하므로 클라이언트 컴포넌트로 분리 */}
            <LikeButtons
              postId={post.id}
              initialLikeCount={parseInt(post.like_count, 10)}
              initialDislikeCount={parseInt(post.dislike_count, 10)}
              initialUserLike={userLikeType}
            />
          </div>
        </div>

        {/* 댓글 섹션: 목록 + 작성 폼 (클라이언트 컴포넌트) */}
        <CommentSection
          postId={post.id}
          currentUserId={authUser.userId}
          currentUserName={currentUserName}
          initialComments={parentComments}
        />
      </div>
    </div>
  );
}
