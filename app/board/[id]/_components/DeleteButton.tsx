"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Button from "@/app/components/Button";

// 부모(서버 컴포넌트)에서 전달받는 props 타입
interface DeleteButtonProps {
  // 삭제할 게시글 ID
  postId: number;
}

// 게시글 삭제 버튼 — 클라이언트 컴포넌트
// 확인 다이얼로그 후 DELETE API 호출, 성공 시 /board로 이동
export default function DeleteButton({ postId }: DeleteButtonProps) {
  // 페이지 이동을 위한 라우터
  const router = useRouter();
  // 삭제 요청 중 중복 클릭 방지
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // 삭제 클릭 핸들러
  const handleDelete = async (): Promise<void> => {
    // 실수 방지를 위한 확인 다이얼로그
    if (!confirm("게시글을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다."))
      return;

    setIsLoading(true);

    try {
      // DELETE /api/posts/[id] 호출
      const response = await fetch(`/api/posts/${postId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        // 삭제 성공: 게시판 목록으로 이동
        router.push("/board");
      } else if (response.status === 401) {
        // 인증 만료: 로그인 페이지로 이동
        router.push("/login");
      } else {
        // 권한 없음 등 기타 오류
        const data: { message: string } = await response.json();
        alert(data.message || "삭제에 실패했습니다.");
      }
    } catch {
      // 네트워크 오류 처리
      alert("네트워크 오류가 발생했습니다. 잠시 후 다시 시도해주세요.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button variant="danger" size="sm" onClick={handleDelete} disabled={isLoading}>
      {isLoading ? "삭제 중..." : "삭제"}
    </Button>
  );
}
