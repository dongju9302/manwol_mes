"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Button from "@/app/components/Button";

// 글쓰기 폼 입력값 타입
interface WriteForm {
  // 게시글 제목 (최대 255자)
  title: string;
  // 게시글 본문
  content: string;
}

// 게시글 작성 페이지 — 클라이언트 컴포넌트
export default function WritePage() {
  // 페이지 이동을 위한 라우터
  const router = useRouter();

  // 폼 입력값 상태
  const [form, setForm] = useState<WriteForm>({ title: "", content: "" });
  // 제출 중 로딩 상태
  const [isLoading, setIsLoading] = useState<boolean>(false);
  // 에러 메시지 상태
  const [errorMessage, setErrorMessage] = useState<string>("");

  // 입력 필드 변경 핸들러 (input, textarea 공용)
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ): void => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setErrorMessage("");
  };

  // 폼 제출 핸들러: POST /api/posts 호출
  const handleSubmit = async (
    e: React.FormEvent<HTMLFormElement>
  ): Promise<void> => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage("");

    try {
      // 게시글 작성 API 호출
      const response = await fetch("/api/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data: { message: string } = await response.json();

      if (response.ok) {
        // 작성 성공: 게시판 목록으로 이동
        router.push("/board");
      } else if (response.status === 401) {
        // 인증 만료: 로그인 페이지로 이동
        router.replace("/login");
      } else {
        // 유효성 검증 등 다른 오류: 메시지 표시
        setErrorMessage(data.message);
      }
    } catch {
      // 네트워크 오류 처리
      setErrorMessage("네트워크 오류가 발생했습니다. 잠시 후 다시 시도해주세요.");
    } finally {
      // 성공·실패 여부와 관계없이 로딩 해제
      setIsLoading(false);
    }
  };

  return (
    // 전체 배경
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-3xl px-4 py-8">
        {/* 페이지 헤더 */}
        <div className="mb-6">
          <div className="mb-1 flex items-center gap-2">
            {/* 뒤로가기 아이콘 버튼 */}
            <Link
              href="/board"
              className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 hover:bg-gray-200 hover:text-gray-600"
              title="게시판으로"
            >
              ←
            </Link>
            <h1 className="text-2xl font-bold text-gray-800">글쓰기</h1>
          </div>
        </div>

        {/* 작성 폼 카드 */}
        <div className="rounded-xl bg-white p-8 shadow-md">
          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            {/* 제목 입력 */}
            <div className="flex flex-col gap-1">
              <label
                htmlFor="title"
                className="text-sm font-medium text-gray-700"
              >
                제목
              </label>
              <input
                id="title"
                type="text"
                name="title"
                value={form.title}
                onChange={handleChange}
                placeholder="제목을 입력하세요 (최대 255자)"
                required
                disabled={isLoading}
                maxLength={255}
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-900 outline-none placeholder:text-gray-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 disabled:bg-gray-100"
              />
            </div>

            {/* 내용 입력 */}
            <div className="flex flex-col gap-1">
              <label
                htmlFor="content"
                className="text-sm font-medium text-gray-700"
              >
                내용
              </label>
              <textarea
                id="content"
                name="content"
                value={form.content}
                onChange={handleChange}
                placeholder="내용을 입력하세요"
                required
                disabled={isLoading}
                rows={12}
                className="resize-none rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-900 outline-none placeholder:text-gray-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 disabled:bg-gray-100"
              />
            </div>

            {/* 에러 메시지 영역: 고정 높이로 레이아웃 변경 방지 */}
            <div className="h-5">
              {errorMessage && (
                <p className="text-sm text-red-500">{errorMessage}</p>
              )}
            </div>

            {/* 버튼 영역: 취소 + 작성 완료 */}
            <div className="flex justify-end gap-3">
              <Link
                href="/board"
                className="rounded-lg border border-gray-300 px-6 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
              >
                취소
              </Link>
              <Button type="submit" variant="primary" disabled={isLoading} className="px-6">
                {isLoading ? "작성 중..." : "작성 완료"}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
