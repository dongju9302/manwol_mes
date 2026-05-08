"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Button from "@/app/components/ui/Button";
import Input from "@/app/components/ui/Input";
import Card from "@/app/components/ui/Card";

// 로그인 폼 입력값 타입
interface LoginForm {
  email: string;
  password: string;
}

// 로그인 페이지 — 클라이언트 컴포넌트
export default function LoginPage() {
  const router = useRouter();

  // 폼 입력값
  const [form, setForm] = useState<LoginForm>({ email: "", password: "" });
  // API 요청 중 로딩 상태
  const [isLoading, setIsLoading] = useState<boolean>(false);
  // 로그인 실패 시 에러 메시지
  const [errorMessage, setErrorMessage] = useState<string>("");
  // 비밀번호 표시/숨기기 토글
  const [showPassword, setShowPassword] = useState<boolean>(false);

  // 입력 변경 핸들러
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setErrorMessage("");
  };

  // 폼 제출 핸들러: POST /api/auth/login
  const handleSubmit = async (
    e: React.FormEvent<HTMLFormElement>
  ): Promise<void> => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage("");

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data: { message: string } = await response.json();

      if (response.ok) {
        // 로그인 성공: 메인 홈 화면으로 이동
        router.push("/");
      } else {
        setErrorMessage(data.message);
      }
    } catch {
      setErrorMessage("네트워크 오류가 발생했습니다. 잠시 후 다시 시도해주세요.");
    } finally {
      setIsLoading(false);
    }
  };

  // 비밀번호 eye 토글 버튼
  const EyeToggle = (
    <button
      type="button"
      onClick={() => setShowPassword((prev) => !prev)}
      className="cursor-pointer text-gray-400 hover:text-gray-600"
      tabIndex={-1}
      aria-label={showPassword ? "비밀번호 숨기기" : "비밀번호 표시"}
    >
      {showPassword ? (
        // 눈 감은 아이콘
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
        </svg>
      ) : (
        // 눈 뜬 아이콘
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
        </svg>
      )}
    </button>
  );

  return (
    // 화면 전체 높이 가운데 정렬
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-8 sm:px-0">
      {/* 로그인 카드 */}
      <Card className="w-full max-w-sm">
        {/* 제목 */}
        <h1 className="mb-6 text-center text-xl font-bold text-gray-900">
          로그인
        </h1>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {/* 이메일 */}
          <Input
            label="이메일"
            id="email"
            type="email"
            name="email"
            value={form.email}
            onChange={handleChange}
            placeholder="이메일을 입력하세요"
            required
            disabled={isLoading}
          />

          {/* 비밀번호 */}
          <Input
            label="비밀번호"
            id="password"
            type={showPassword ? "text" : "password"}
            name="password"
            value={form.password}
            onChange={handleChange}
            placeholder="비밀번호를 입력하세요"
            required
            disabled={isLoading}
            suffix={EyeToggle}
          />

          {/* API 에러 메시지 */}
          <div className="h-5">
            {errorMessage && (
              <p className="text-xs text-red-500">{errorMessage}</p>
            )}
          </div>

          {/* 로그인 버튼 */}
          <Button
            type="submit"
            variant="primary"
            size="lg"
            disabled={isLoading}
            className="w-full"
          >
            {isLoading ? "로그인 중..." : "로그인"}
          </Button>

          {/* 회원가입 링크 */}
          <p className="text-center text-sm text-gray-500">
            계정이 없으신가요?{" "}
            <Link href="/register" className="font-medium text-blue-600 hover:underline">
              회원가입
            </Link>
          </p>
        </form>
      </Card>
    </div>
  );
}
