"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Button from "@/app/components/ui/Button";
import Input from "@/app/components/ui/Input";

// 로그인 폼 입력값 타입
interface LoginForm {
  email: string;
  password: string;
}

// localStorage 키 (오타 방지 위해 상수화)
const REMEMBER_EMAIL_KEY = "manwol_remember_email";

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
  // 이메일 저장 체크박스 상태
  const [rememberEmail, setRememberEmail] = useState<boolean>(false);

  // 컴포넌트 마운트 시 localStorage에서 저장된 이메일 불러오기
  // SSR 환경에서는 window가 없으므로 useEffect 내부에서만 접근 (Next.js 서버 렌더링 대응)
  useEffect(() => {
    const savedEmail = localStorage.getItem(REMEMBER_EMAIL_KEY);
    if (savedEmail) {
      // 저장된 이메일이 있으면 input에 자동 입력하고 체크박스도 자동 체크
      setForm((prev) => ({ ...prev, email: savedEmail }));
      setRememberEmail(true);
    }
  }, []);

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
        // 로그인 성공 시점에만 이메일 저장/삭제 처리
        // 실패한 이메일이 저장되지 않도록 반드시 성공 분기 안에서만 실행
        if (rememberEmail) {
          // 체크박스 ON: 입력한 이메일을 localStorage에 저장
          localStorage.setItem(REMEMBER_EMAIL_KEY, form.email);
        } else {
          // 체크박스 OFF: 기존에 저장된 이메일이 있다면 삭제
          localStorage.removeItem(REMEMBER_EMAIL_KEY);
        }

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
  // min-h/w-[44px]: 모바일 최소 터치 영역 확보 (Apple HIG 권장)
  // 아이콘은 h-5 w-5(20px)로 유지, 버튼 패딩이 클릭 영역을 확장
  const EyeToggle = (
    <button
      type="button"
      onClick={() => setShowPassword((prev) => !prev)}
      className="flex min-h-[44px] min-w-[44px] cursor-pointer items-center justify-center text-gray-400 hover:text-gray-600"
      tabIndex={-1}
      aria-label={showPassword ? "비밀번호 숨기기" : "비밀번호 표시"}
    >
      {showPassword ? (
        // 눈 감은 아이콘
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
        </svg>
      ) : (
        // 눈 뜬 아이콘
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
        </svg>
      )}
    </button>
  );

  return (
    // min-h-screen-dvh: 소프트 키보드 올라와도 레이아웃 안정 (globals.css 유틸)
    // 모바일: 흰 배경(앱 느낌), PC(sm+): 회색 배경으로 카드 부각
    <div className="flex min-h-screen-dvh items-center justify-center bg-white pt-12 pb-8 sm:bg-gray-50 sm:p-8">
      {/* 로그인 카드
          모바일: border·shadow 없음 → full-bleed 앱 느낌
          PC(sm+): rounded + border + shadow → 카드 스타일 복원 */}
      <div className="w-full max-w-sm p-6 sm:rounded-xl sm:border sm:border-gray-200 sm:shadow-sm">
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
            size="lg"
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
            size="lg"
          />

          {/* 이메일 저장 체크박스
              accent-blue-600: 체크 시 브랜드 컬러 적용 (별도 커스텀 체크박스 컴포넌트 없이 네이티브 사용)
              cursor-pointer: 체크박스와 label 모두 클릭 가능하도록 */}
          <label className="flex cursor-pointer items-center gap-2 text-sm text-gray-700">
            <input
              type="checkbox"
              checked={rememberEmail}
              onChange={(e) => setRememberEmail(e.target.checked)}
              disabled={isLoading}
              className="h-4 w-4 cursor-pointer accent-blue-600"
            />
            이메일 저장
          </label>

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
      </div>
    </div>
  );
}
