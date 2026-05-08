"use client";

import { useState } from "react";

// 댓글 행 타입 (서버에서 전달받는 구조와 동일)
interface CommentRow {
  // 댓글 고유 식별자
  id: number;
  // 소속 게시글 ID
  post_id: number;
  // 작성자 사용자 ID
  user_id: number;
  // 부모 댓글 ID (null이면 최상위 댓글)
  parent_id: number | null;
  // 댓글 본문
  content: string;
  // 논리 삭제 여부: true이면 "삭제된 댓글입니다" 표시 (활성 대댓글이 있을 때만 포함됨)
  is_deleted: boolean;
  // 작성자 이름
  author_name: string;
  // 작성 시각 (문자열)
  created_at: string;
}

// 대댓글 배열을 포함한 최상위 댓글 타입
interface CommentWithReplies extends CommentRow {
  // 이 댓글에 달린 활성 대댓글 목록 (is_deleted=false만 포함)
  replies: CommentRow[];
}

// 부모(서버 컴포넌트)에서 전달받는 props 타입
interface CommentSectionProps {
  // 댓글이 속한 게시글 ID
  postId: number;
  // 현재 로그인한 사용자의 ID (내 댓글 삭제 버튼 표시에 사용)
  currentUserId: number;
  // 현재 로그인한 사용자의 이름 (댓글 추가 시 author_name에 사용)
  currentUserName: string;
  // 서버에서 조회한 초기 댓글 목록 (삭제+대댓글 있는 경우 is_deleted=true로 포함)
  initialComments: CommentWithReplies[];
}

// 날짜 문자열을 한국어 형식으로 변환
function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

// 댓글·대댓글 목록 + 작성 폼 — 클라이언트 컴포넌트
export default function CommentSection({
  postId,
  currentUserId,
  currentUserName,
  initialComments,
}: CommentSectionProps) {
  // 댓글 목록 상태 (낙관적 업데이트용)
  const [comments, setComments] =
    useState<CommentWithReplies[]>(initialComments);
  // 새 댓글 입력값
  const [newComment, setNewComment] = useState<string>("");
  // 대댓글 작성 중인 부모 댓글 ID (null이면 대댓글 폼 미표시)
  const [replyToId, setReplyToId] = useState<number | null>(null);
  // 대댓글 입력값
  const [replyContent, setReplyContent] = useState<string>("");
  // 댓글 제출 로딩
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  // 대댓글 제출 로딩
  const [isReplying, setIsReplying] = useState<boolean>(false);

  // 전체 댓글 수 (최상위 + 대댓글 합산, 삭제된 최상위 댓글은 카운트 제외)
  const totalComments = comments.reduce(
    (acc, c) => acc + (c.is_deleted ? 0 : 1) + c.replies.length,
    0
  );

  // 새 댓글 제출 (최상위 댓글)
  const handleSubmitComment = async (
    e: React.FormEvent<HTMLFormElement>
  ): Promise<void> => {
    e.preventDefault();
    if (!newComment.trim()) return;
    setIsSubmitting(true);

    try {
      const response = await fetch(`/api/posts/${postId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: newComment }),
      });

      if (response.ok) {
        const data: { commentId: number } = await response.json();
        // 낙관적 업데이트: 서버 재조회 없이 바로 목록에 추가
        const added: CommentWithReplies = {
          id: data.commentId,
          post_id: postId,
          user_id: currentUserId,
          parent_id: null,
          content: newComment,
          is_deleted: false,
          author_name: currentUserName,
          created_at: new Date().toISOString(),
          replies: [],
        };
        setComments((prev) => [...prev, added]);
        setNewComment("");
      } else if (response.status === 401) {
        window.location.href = "/login";
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // 대댓글 제출
  const handleSubmitReply = async (
    e: React.FormEvent<HTMLFormElement>
  ): Promise<void> => {
    e.preventDefault();
    if (!replyContent.trim() || replyToId === null) return;
    setIsReplying(true);

    try {
      const response = await fetch(`/api/posts/${postId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: replyContent, parent_id: replyToId }),
      });

      if (response.ok) {
        const data: { commentId: number } = await response.json();
        const newReply: CommentRow = {
          id: data.commentId,
          post_id: postId,
          user_id: currentUserId,
          parent_id: replyToId,
          content: replyContent,
          is_deleted: false,
          author_name: currentUserName,
          created_at: new Date().toISOString(),
        };
        // 해당 부모 댓글의 replies 배열에 추가
        setComments((prev) =>
          prev.map((c) =>
            c.id === replyToId
              ? { ...c, replies: [...c.replies, newReply] }
              : c
          )
        );
        setReplyContent("");
        setReplyToId(null);
      } else if (response.status === 401) {
        window.location.href = "/login";
      }
    } finally {
      setIsReplying(false);
    }
  };

  // 댓글/대댓글 삭제 (낙관적 업데이트)
  const handleDeleteComment = async (
    commentId: number,
    parentId: number | null
  ): Promise<void> => {
    if (!confirm("댓글을 삭제하시겠습니까?")) return;

    const response = await fetch(
      `/api/posts/${postId}/comments/${commentId}`,
      { method: "DELETE" }
    );

    if (!response.ok) return;

    setComments((prev) => {
      let updated = prev;

      if (parentId === null) {
        // ── 최상위 댓글 삭제 ──────────────────────────────────
        // 대댓글이 있으면: is_deleted=true로 마킹 → "삭제된 댓글입니다" 표시
        // 대댓글이 없으면: 목록에서 완전히 제거
        updated = updated.map((c) =>
          c.id === commentId ? { ...c, is_deleted: true } : c
        );
      } else {
        // ── 대댓글 삭제: 해당 replies 배열에서 제거 ──────────
        updated = updated.map((c) =>
          c.id === parentId
            ? { ...c, replies: c.replies.filter((r) => r.id !== commentId) }
            : c
        );
      }

      // is_deleted=true이면서 대댓글도 0개인 최상위 댓글은 완전히 제거
      // (대댓글을 마지막으로 삭제한 직후 부모도 숨겨야 하는 경우 처리)
      return updated.filter(
        (c) => !(c.is_deleted && c.replies.length === 0)
      );
    });
  };

  // 답글 버튼 토글: 같은 댓글 재클릭 시 폼 닫힘
  const toggleReply = (commentId: number): void => {
    if (replyToId === commentId) {
      setReplyToId(null);
      setReplyContent("");
    } else {
      setReplyToId(commentId);
      setReplyContent("");
    }
  };

  return (
    <div className="overflow-hidden rounded-xl bg-white shadow-md">
      {/* 댓글 섹션 헤더 */}
      <div className="border-b border-gray-100 px-8 py-4">
        <h2 className="font-semibold text-gray-800">댓글 {totalComments}개</h2>
      </div>

      {/* 댓글 목록 */}
      <div className="divide-y divide-gray-50">
        {comments.length === 0 ? (
          // 댓글 없을 때 안내 메시지
          <div className="px-8 py-10 text-center text-sm text-gray-400">
            아직 댓글이 없습니다. 첫 댓글을 작성해보세요!
          </div>
        ) : (
          comments.map((comment) => (
            <div key={comment.id} className="px-8 py-5">
              {/* ── 최상위 댓글 ───────────────────────────────── */}
              {comment.is_deleted ? (
                // 삭제된 댓글: "삭제된 댓글입니다" 플레이스홀더만 표시
                // 작성자·내용·버튼 모두 숨김, 대댓글은 정상 표시
                <p className="text-sm italic text-gray-400">
                  삭제된 댓글입니다.
                </p>
              ) : (
                // 활성 댓글: 정상 표시
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    {/* 작성자 이름 + 날짜 */}
                    <div className="mb-1 flex items-center gap-2">
                      <span className="text-sm font-semibold text-gray-800">
                        {comment.author_name}
                      </span>
                      <span className="text-xs text-gray-400">
                        {formatDate(comment.created_at)}
                      </span>
                    </div>
                    {/* 댓글 본문 */}
                    <p className="whitespace-pre-wrap text-sm text-gray-700">
                      {comment.content}
                    </p>
                  </div>

                  {/* 액션 버튼: 답글 + 본인 댓글 삭제 */}
                  <div className="ml-4 flex shrink-0 gap-3">
                    <button
                      onClick={() => toggleReply(comment.id)}
                      className="text-xs text-blue-500 hover:text-blue-700"
                    >
                      {replyToId === comment.id ? "취소" : "답글"}
                    </button>
                    {comment.user_id === currentUserId && (
                      <button
                        onClick={() => handleDeleteComment(comment.id, null)}
                        className="text-xs text-red-400 hover:text-red-600"
                      >
                        삭제
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* ── 대댓글 목록: 왼쪽 구분선으로 들여쓰기 표현 ── */}
              {comment.replies.length > 0 && (
                <div className="mt-4 space-y-4 border-l-2 border-gray-100 pl-6">
                  {comment.replies.map((reply) => (
                    <div
                      key={reply.id}
                      className="flex items-start justify-between"
                    >
                      <div className="flex-1">
                        <div className="mb-1 flex items-center gap-2">
                          <span className="text-sm font-semibold text-gray-800">
                            {reply.author_name}
                          </span>
                          <span className="text-xs text-gray-400">
                            {formatDate(reply.created_at)}
                          </span>
                        </div>
                        <p className="whitespace-pre-wrap text-sm text-gray-700">
                          {reply.content}
                        </p>
                      </div>
                      {/* 본인 대댓글만 삭제 버튼 표시 */}
                      {reply.user_id === currentUserId && (
                        <button
                          onClick={() =>
                            handleDeleteComment(reply.id, comment.id)
                          }
                          className="ml-4 shrink-0 text-xs text-red-400 hover:text-red-600"
                        >
                          삭제
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* 대댓글 작성 폼: 해당 댓글의 답글 버튼 클릭 시 표시 */}
              {replyToId === comment.id && (
                <form
                  onSubmit={handleSubmitReply}
                  className="mt-4 flex gap-2 pl-6"
                >
                  <input
                    type="text"
                    value={replyContent}
                    onChange={(e) => setReplyContent(e.target.value)}
                    placeholder="답글을 입력하세요"
                    disabled={isReplying}
                    className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 outline-none placeholder:text-gray-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 disabled:bg-gray-100"
                  />
                  <button
                    type="submit"
                    disabled={isReplying || !replyContent.trim()}
                    className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-400"
                  >
                    {isReplying ? "등록 중..." : "등록"}
                  </button>
                </form>
              )}
            </div>
          ))
        )}
      </div>

      {/* 새 댓글 작성 폼 */}
      <div className="border-t border-gray-100 px-8 py-5">
        <form onSubmit={handleSubmitComment} className="flex gap-3">
          <textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="댓글을 입력하세요"
            disabled={isSubmitting}
            rows={1}
            className="flex-1 resize-none rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-900 outline-none placeholder:text-gray-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 disabled:bg-gray-100"
          />
          <button
            type="submit"
            disabled={isSubmitting || !newComment.trim()}
            className="self-end rounded-lg bg-blue-600 px-5 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-400"
          >
            {isSubmitting ? "등록 중..." : "댓글 등록"}
          </button>
        </form>
      </div>
    </div>
  );
}
