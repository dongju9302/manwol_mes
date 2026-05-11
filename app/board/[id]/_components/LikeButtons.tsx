"use client";

import { useState } from "react";

// 부모(서버 컴포넌트)에서 전달받는 props 타입
interface LikeButtonsProps {
  // 좋아요/싫어요를 등록할 게시글 ID
  postId: number;
  // 초기 좋아요 수 (서버에서 조회한 값)
  initialLikeCount: number;
  // 초기 싫어요 수 (서버에서 조회한 값)
  initialDislikeCount: number;
  // 현재 로그인한 사용자의 반응 타입 (미반응이면 null)
  initialUserLike: "like" | "dislike" | null;
}

// 좋아요/싫어요 토글 버튼 — 클라이언트 컴포넌트
// 클릭 즉시 UI 업데이트(낙관적 업데이트) 후 API 호출
export default function LikeButtons({
  postId,
  initialLikeCount,
  initialDislikeCount,
  initialUserLike,
}: LikeButtonsProps) {
  // 표시할 좋아요 수 (클릭 시 즉시 반영)
  const [likeCount, setLikeCount] = useState<number>(initialLikeCount);
  // 표시할 싫어요 수
  const [dislikeCount, setDislikeCount] = useState<number>(initialDislikeCount);
  // 현재 사용자의 반응 상태 (버튼 활성화 여부에 사용)
  const [userLike, setUserLike] = useState<"like" | "dislike" | null>(
    initialUserLike
  );
  // API 요청 중 중복 클릭 방지
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // 좋아요/싫어요 버튼 클릭 핸들러
  const handleLike = async (type: "like" | "dislike"): Promise<void> => {
    if (isLoading) return;
    setIsLoading(true);

    try {
      const response = await fetch(`/api/posts/${postId}/likes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type }),
      });

      if (response.ok) {
        if (userLike === type) {
          // 같은 타입 재클릭 → 취소 (카운트 -1, 상태 null)
          if (type === "like") setLikeCount((c) => c - 1);
          else setDislikeCount((c) => c - 1);
          setUserLike(null);
        } else {
          // 다른 타입 클릭 또는 최초 클릭
          if (type === "like") {
            setLikeCount((c) => c + 1);
            // 기존에 싫어요를 눌렀다면 싫어요 카운트도 감소
            if (userLike === "dislike") setDislikeCount((c) => c - 1);
          } else {
            setDislikeCount((c) => c + 1);
            // 기존에 좋아요를 눌렀다면 좋아요 카운트도 감소
            if (userLike === "like") setLikeCount((c) => c - 1);
          }
          setUserLike(type);
        }
      } else if (response.status === 401) {
        // 인증 만료: 로그인 페이지로 이동
        window.location.href = "/login";
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex gap-3">
      {/* 좋아요 버튼: 활성 상태면 blue-600 배경 */}
      <button
        onClick={() => handleLike("like")}
        disabled={isLoading}
        className={`flex min-h-[44px] items-center gap-2 rounded-full px-6 py-2 text-sm font-semibold transition-colors disabled:cursor-not-allowed
          ${
            userLike === "like"
              ? "bg-blue-600 text-white"
              : "bg-gray-100 text-gray-600 hover:bg-blue-50 hover:text-blue-600"
          }`}
      >
        👍 {likeCount}
      </button>

      {/* 싫어요 버튼: 활성 상태면 red-500 배경 */}
      <button
        onClick={() => handleLike("dislike")}
        disabled={isLoading}
        className={`flex min-h-[44px] items-center gap-2 rounded-full px-6 py-2 text-sm font-semibold transition-colors disabled:cursor-not-allowed
          ${
            userLike === "dislike"
              ? "bg-red-500 text-white"
              : "bg-gray-100 text-gray-600 hover:bg-red-50 hover:text-red-500"
          }`}
      >
        👎 {dislikeCount}
      </button>
    </div>
  );
}
