import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import pool from "@/lib/db";
import { verifyAuthFromCookies } from "@/lib/auth";
import LikeButtons from "./_components/LikeButtons";
import CommentSection from "./_components/CommentSection";
import DeleteButton from "./_components/DeleteButton";
import Card from "@/app/components/ui/Card";

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
  // is_deleted: 댓글 논리 삭제 여부 (삭제됐지만 대댓글이 있는 경우 포함)
  is_deleted: boolean;
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

  // 작성자 본인이 아닌 경우에만 view_count 증가
  // (서버 컴포넌트가 실제 조회 경로이므로 여기서 처리)
  if (post.user_id !== authUser.userId) {
    await pool.query(
      "UPDATE posts SET view_count = view_count + 1 WHERE id = $1",
      [postId]
    );
  }

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

  // 댓글 목록 조회 (is_deleted 포함, 전체 조회 후 JS에서 필터링)
  // Soft Delete 전략: API route와 동일한 로직 적용
  const commentsResult = await pool.query<CommentRow>(
    `SELECT
       c.id,
       c.post_id,
       c.user_id,
       c.parent_id,
       c.content,
       c.is_deleted,
       u.name        AS author_name,
       c.created_at::text AS created_at
     FROM comments c
     JOIN users u ON c.user_id = u.id
     WHERE c.post_id = $1
     ORDER BY c.created_at ASC`,
    [postId]
  );

  // 활성 대댓글(is_deleted=false)만 replyMap에 수집
  const replyMap = new Map<number, CommentRow[]>();
  for (const comment of commentsResult.rows) {
    if (comment.parent_id !== null && !comment.is_deleted) {
      if (!replyMap.has(comment.parent_id)) {
        replyMap.set(comment.parent_id, []);
      }
      replyMap.get(comment.parent_id)!.push(comment);
    }
  }

  // 최상위 댓글 필터링:
  //   포함: is_deleted=false 이거나, is_deleted=true이고 활성 대댓글이 있는 경우
  //   제외: is_deleted=true이고 활성 대댓글이 없는 경우
  const parentComments: CommentWithReplies[] = [];
  for (const comment of commentsResult.rows) {
    if (comment.parent_id !== null) continue;
    const hasActiveReplies = (replyMap.get(comment.id)?.length ?? 0) > 0;
    if (!comment.is_deleted || hasActiveReplies) {
      parentComments.push({ ...comment, replies: replyMap.get(comment.id) ?? [] });
    }
  }

  // 현재 로그인 사용자가 게시글 작성자인지 여부
  const isAuthor = post.user_id === authUser.userId;

  return (
    <div className="min-h-full bg-gray-50">
      <div className="mx-auto max-w-3xl px-4 py-6 md:py-8">
        {/* 게시판으로 돌아가기 */}
        <Link
          href="/board"
          className="mb-4 inline-block text-sm text-gray-500 hover:text-blue-600"
        >
          ← 게시판으로
        </Link>

        {/* 게시글 카드 */}
        <Card padding={false} className="mb-6">
          {/* 게시글 헤더 */}
          <div className="border-b border-gray-100 px-6 py-5">
            <h1 className="mb-3 text-xl font-bold text-gray-900 md:text-2xl">
              {post.title}
            </h1>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-sm text-gray-500">
                {post.author_name} · {formatDate(post.created_at)}
              </span>

              {/* 수정/삭제: 작성자 본인만 */}
              {isAuthor && (
                <div className="flex gap-2">
                  <Link
                    href={`/board/${post.id}/edit`}
                    className="inline-flex min-h-[44px] items-center rounded-md border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 transition-colors hover:bg-gray-50 md:min-h-[36px]"
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
          <div className="px-6 py-5">
            <p className="whitespace-pre-wrap leading-relaxed text-gray-700">
              {post.content}
            </p>
          </div>

          {/* 좋아요/싫어요 */}
          <div className="flex justify-center border-t border-gray-100 px-6 py-4">
            <LikeButtons
              postId={post.id}
              initialLikeCount={parseInt(post.like_count, 10)}
              initialDislikeCount={parseInt(post.dislike_count, 10)}
              initialUserLike={userLikeType}
            />
          </div>
        </Card>

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
