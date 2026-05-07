"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

// 로그인 폼의 입력값 타입 정의
interface LoginForm {
  email: string;
  password: string;
}

// 로그인 페이지 컴포넌트: 이메일과 비밀번호를 입력받아 로그인 처리
export default function LoginPage() {
  // 페이지 이동을 위한 라우터
  const router = useRouter();

  // 폼 입력값 상태 관리
  const [form, setForm] = useState<LoginForm>({
    email: "",
    password: "",
  });

  // API 요청 중 로딩 상태
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // 로그인 실패 시 표시할 에러 메시지
  const [errorMessage, setErrorMessage] = useState<string>("");

  // 입력 필드 변경 핸들러: 입력값을 상태에 반영하고 에러 메시지 초기화
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setErrorMessage("");
  };

  // 폼 제출 핸들러: /api/auth/login API 호출 후 결과 처리
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage("");

    try {
      // 로그인 API 호출
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(form),
      });

      // 응답 본문 파싱
      const data: { message: string } = await response.json();

      if (response.ok) {
        // 로그인 성공: 홈 화면으로 이동
        router.push("/board");
      } else {
        // 로그인 실패: 서버에서 받은 에러 메시지 표시
        setErrorMessage(data.message);
      }
    } catch {
      // 네트워크 오류 등 예외 처리
      setErrorMessage("네트워크 오류가 발생했습니다. 잠시 후 다시 시도해주세요.");
    } finally {
      // 성공·실패 여부와 관계없이 로딩 상태 해제
      setIsLoading(false);
    }
  };

  return (
    // 화면 전체 높이를 차지하며 콘텐츠를 가운데 정렬
    <div className="flex h-screen items-center justify-center bg-gray-50">
      {/* 로그인 카드 컨테이너 */}
      <div className="w-full max-w-sm rounded-xl bg-white p-8 shadow-md">
        {/* 페이지 제목 */}
        <h1 className="mb-6 text-center text-2xl font-bold text-gray-800">
          로그인
        </h1>

        {/* 로그인 폼 */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {/* 이메일 입력 필드 */}
          <div className="flex flex-col gap-1">
            <label htmlFor="email" className="text-sm font-medium text-gray-700">
              이메일
            </label>
            <input
              id="email"
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              placeholder="이메일을 입력하세요"
              required
              disabled={isLoading}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-900 outline-none placeholder:text-gray-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 disabled:bg-gray-100 dark:border-gray-600 dark:bg-white dark:text-gray-900"
            />
          </div>

          {/* 비밀번호 입력 필드 */}
          <div className="flex flex-col gap-1">
            <label htmlFor="password" className="text-sm font-medium text-gray-700">
              비밀번호
            </label>
            <input
              id="password"
              type="password"
              name="password"
              value={form.password}
              onChange={handleChange}
              placeholder="비밀번호를 입력하세요"
              required
              disabled={isLoading}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-900 outline-none placeholder:text-gray-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 disabled:bg-gray-100 dark:border-gray-600 dark:bg-white dark:text-gray-900"
            />
          </div>

          {/* 에러 메시지 영역: 항상 고정 높이 유지하여 레이아웃 변경 방지 */}
          <div className="h-5">
            {errorMessage && (
              <p className="text-sm text-red-500">
                {errorMessage}
              </p>
            )}
          </div>

          {/* 로그인 제출 버튼: 로딩 중 비활성화 및 텍스트 변경 */}
          <button
            type="submit"
            disabled={isLoading}
            className="mt-2 rounded-lg bg-blue-600 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-400"
          >
            {isLoading ? "로그인 중..." : "로그인"}
          </button>

          {/* 회원가입 페이지 이동 링크 */}
          <p className="text-center text-sm text-gray-500">
            계정이 없으신가요?{" "}
            <Link href="/register" className="font-medium text-blue-600 hover:underline">
              회원가입
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
