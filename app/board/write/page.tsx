"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Button from "@/app/components/ui/Button";
import Input from "@/app/components/ui/Input";
import Card from "@/app/components/ui/Card";

// 글쓰기 폼 입력값 타입
interface WriteForm {
  title: string;
  content: string;
}

// 게시글 작성 페이지 — 클라이언트 컴포넌트
export default function WritePage() {
  const router = useRouter();

  const [form, setForm] = useState<WriteForm>({ title: "", content: "" });
  const [isLoading, setIsLoading]       = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>("");

  // 입력 변경 핸들러 (input·textarea 공용)
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ): void => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setErrorMessage("");
  };

  // 폼 제출: POST /api/posts
  const handleSubmit = async (
    e: React.FormEvent<HTMLFormElement>
  ): Promise<void> => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage("");

    try {
      const response = await fetch("/api/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data: { message: string } = await response.json();

      if (response.ok) {
        router.push("/board");
      } else if (response.status === 401) {
        router.replace("/login");
      } else {
        setErrorMessage(data.message);
      }
    } catch {
      setErrorMessage("네트워크 오류가 발생했습니다. 잠시 후 다시 시도해주세요.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-full bg-gray-50">
      <div className="mx-auto max-w-3xl px-4 py-6 md:py-8">

        {/* 페이지 헤더 */}
        <div className="mb-6 flex items-center gap-2">
          <Link
            href="/board"
            className="flex h-9 w-9 items-center justify-center rounded-md text-gray-400 hover:bg-gray-200 hover:text-gray-600"
            title="게시판으로"
          >
            ←
          </Link>
          <h1 className="text-xl font-bold text-gray-900">글쓰기</h1>
        </div>

        {/* 작성 폼 카드 */}
        <Card>
          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            {/* 제목 */}
            <Input
              label="제목"
              id="title"
              type="text"
              name="title"
              value={form.title}
              onChange={handleChange}
              placeholder="제목을 입력하세요 (최대 255자)"
              required
              disabled={isLoading}
              maxLength={255}
            />

            {/* 내용 (textarea는 Input이 아닌 별도 처리) */}
            <div className="flex flex-col gap-1">
              <label htmlFor="content" className="text-sm font-medium text-gray-700">
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
                rows={14}
                className="resize-none rounded-md border border-gray-200 px-3 py-2 text-sm text-gray-900 outline-none placeholder:text-gray-400 transition-colors focus:border-blue-500 focus:ring-1 focus:ring-blue-100 disabled:bg-gray-50 disabled:text-gray-400"
              />
            </div>

            {/* 에러 메시지 */}
            <div className="h-5">
              {errorMessage && (
                <p className="text-sm text-red-500">{errorMessage}</p>
              )}
            </div>

            {/* 버튼 영역 */}
            <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
              <Link
                href="/board"
                className="inline-flex min-h-[44px] items-center justify-center rounded-md border border-gray-200 px-5 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50"
              >
                취소
              </Link>
              <Button
                type="submit"
                variant="primary"
                size="lg"
                disabled={isLoading}
                className="px-6"
              >
                {isLoading ? "작성 중..." : "작성 완료"}
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
}
