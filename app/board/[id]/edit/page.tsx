"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

// 수정 폼 입력값 타입
interface EditForm {
  // 게시글 제목 (최대 255자)
  title: string;
  // 게시글 본문
  content: string;
}

// 게시글 수정 페이지 — 클라이언트 컴포넌트
// params는 Next.js 15+에서 Promise 타입이므로 React.use()로 언래핑
export default function EditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  // 클라이언트 컴포넌트에서 동적 params 접근: use()로 Promise 언래핑
  const { id } = use(params);
  // 페이지 이동을 위한 라우터
  const router = useRouter();

  // 폼 입력값 상태 (마운트 시 기존 데이터로 초기화)
  const [form, setForm] = useState<EditForm>({ title: "", content: "" });
  // 초기 데이터 로딩 상태
  const [isLoading, setIsLoading] = useState<boolean>(true);
  // 수정 제출 중 상태
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  // 에러 메시지 상태
  const [errorMessage, setErrorMessage] = useState<string>("");

  // 마운트 시 기존 게시글 데이터 불러오기
  useEffect(() => {
    const loadPost = async (): Promise<void> => {
      try {
        const response = await fetch(`/api/posts/${id}`);

        if (response.ok) {
          // 성공: 기존 제목·내용으로 폼 초기화
          const data: { post: { title: string; content: string } } =
            await response.json();
          setForm({ title: data.post.title, content: data.post.content });
        } else if (response.status === 401) {
          // 인증 만료: 로그인으로 이동
          router.replace("/login");
        } else {
          // 게시글 없음 등: 목록으로 이동
          router.replace("/board");
        }
      } catch {
        // 네트워크 오류: 목록으로 이동
        router.replace("/board");
      } finally {
        setIsLoading(false);
      }
    };

    loadPost();
  }, [id, router]);

  // 입력 필드 변경 핸들러 (input, textarea 공용)
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ): void => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setErrorMessage("");
  };

  // 폼 제출 핸들러: PUT /api/posts/[id] 호출
  const handleSubmit = async (
    e: React.FormEvent<HTMLFormElement>
  ): Promise<void> => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMessage("");

    try {
      const response = await fetch(`/api/posts/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data: { message: string } = await response.json();

      if (response.ok) {
        // 수정 성공: 해당 게시글 상세 페이지로 이동
        router.push(`/board/${id}`);
      } else if (response.status === 401) {
        // 인증 만료: 로그인으로 이동
        router.replace("/login");
      } else if (response.status === 403) {
        // 권한 없음: 상세 페이지로 이동
        router.replace(`/board/${id}`);
      } else {
        // 유효성 검증 등 기타 오류
        setErrorMessage(data.message);
      }
    } catch {
      setErrorMessage("네트워크 오류가 발생했습니다. 잠시 후 다시 시도해주세요.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // 초기 데이터 로딩 중 표시
  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <p className="text-sm text-gray-400">불러오는 중...</p>
      </div>
    );
  }

  return (
    // 전체 배경
    <div className="min-h-full bg-gray-50">
      {/* 모바일: py-4, 데스크탑: py-8 */}
      <div className="mx-auto max-w-3xl px-4 py-4 md:py-8">
        {/* 페이지 헤더: 뒤로가기 링크 + 제목 */}
        {/* 모바일: pl-12로 햄버거 버튼 공간 확보 */}
        <div className="mb-6 flex items-center gap-4 pl-12 md:pl-0">
          <Link
            href={`/board/${id}`}
            className="flex min-h-[44px] items-center text-sm text-gray-500 hover:text-blue-600"
          >
            ← 게시글로
          </Link>
          <h1 className="text-xl font-bold text-gray-800 md:text-2xl">게시글 수정</h1>
        </div>

        {/* 수정 폼 카드: 모바일 p-4, 데스크탑 p-8 */}
        <div className="rounded-xl bg-white p-4 shadow-md md:p-8">
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
                required
                disabled={isSubmitting}
                maxLength={255}
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-900 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 disabled:bg-gray-100"
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
                required
                disabled={isSubmitting}
                rows={10}
                className="resize-none rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-900 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 disabled:bg-gray-100"
              />
            </div>

            {/* 에러 메시지 영역: 고정 높이로 레이아웃 변경 방지 */}
            <div className="h-5">
              {errorMessage && (
                <p className="text-sm text-red-500">{errorMessage}</p>
              )}
            </div>

            {/* 버튼 영역: 취소 + 수정 완료 (모바일: 전체 너비, 데스크탑: 우측 정렬) */}
            <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
              <Link
                href={`/board/${id}`}
                className="flex min-h-[44px] items-center justify-center rounded-lg border border-gray-300 px-6 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
              >
                취소
              </Link>
              <button
                type="submit"
                disabled={isSubmitting}
                className="min-h-[44px] rounded-lg bg-blue-600 px-6 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-400"
              >
                {isSubmitting ? "수정 중..." : "수정 완료"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
