"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Button from "@/app/components/ui/Button";
import Input from "@/app/components/ui/Input";
import Card from "@/app/components/ui/Card";

// 회원가입 폼 입력값 타입
interface RegisterForm {
  name: string;
  phone: string;
  email: string;
  password: string;
}

// 이메일 중복 검사 상태
type EmailCheckStatus = "idle" | "checking" | "available" | "taken";

// 이메일 형식 검증 정규식 (route.ts와 동일)
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// 연락처 형식 검증 정규식: 010-XXXX-XXXX
const PHONE_REGEX = /^010-\d{4}-\d{4}$/;

// 회원가입 페이지 — 클라이언트 컴포넌트
export default function RegisterPage() {
  const router = useRouter();

  // 폼 입력값
  const [form, setForm] = useState<RegisterForm>({
    name: "", phone: "", email: "", password: "",
  });

  // 로딩·에러
  const [isLoading, setIsLoading]       = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>("");

  // 비밀번호 표시/숨기기
  const [showPassword, setShowPassword] = useState<boolean>(false);

  // 이메일 중복 검사 상태
  const [emailCheckStatus, setEmailCheckStatus] =
    useState<EmailCheckStatus>("idle");

  // 각 필드 blur 여부 (true일 때만 유효성 메시지 표시)
  const [nameTouched, setNameTouched]         = useState<boolean>(false);
  const [phoneTouched, setPhoneTouched]       = useState<boolean>(false);
  const [emailTouched, setEmailTouched]       = useState<boolean>(false);
  const [passwordTouched, setPasswordTouched] = useState<boolean>(false);

  // ── 유효성 계산 ────────────────────────────────────────────

  const isNameValid:     boolean = form.name.trim().length >= 1;
  const isEmailValid:    boolean =
    EMAIL_REGEX.test(form.email) && emailCheckStatus === "available";
  const isPhoneValid:    boolean = PHONE_REGEX.test(form.phone);
  const isPasswordValid: boolean = form.password.length >= 8;
  const isFormValid:     boolean =
    isNameValid && isEmailValid && isPhoneValid && isPasswordValid;

  // ── Input error/success 계산 ───────────────────────────────

  // 이름
  const nameError = nameTouched && !isNameValid
    ? "이름을 입력해주세요." : undefined;

  // 연락처
  const phoneError   = phoneTouched && !isPhoneValid
    ? "올바른 연락처 형식이 아닙니다. (010-0000-0000)" : undefined;
  const phoneSuccess = phoneTouched && isPhoneValid
    ? "올바른 연락처입니다." : undefined;

  // 이메일
  const emailError = emailTouched && !EMAIL_REGEX.test(form.email)
    ? "올바른 이메일 형식이 아닙니다."
    : emailCheckStatus === "taken"
      ? "이미 사용 중인 이메일입니다." : undefined;
  const emailSuccess = emailCheckStatus === "available"
    ? "사용 가능한 이메일입니다." : undefined;
  const emailHint = emailCheckStatus === "checking"
    ? "확인 중..." : undefined;

  // 비밀번호
  const passwordError = passwordTouched && !isPasswordValid
    ? "비밀번호는 8자 이상이어야 합니다." : undefined;
  const passwordSuccess = passwordTouched && isPasswordValid
    ? "사용 가능한 비밀번호입니다." : undefined;

  // ── 핸들러 ─────────────────────────────────────────────────

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setErrorMessage("");
    // 이메일 수정 시 중복 검사 상태 초기화
    if (name === "email") {
      setEmailCheckStatus("idle");
      setEmailTouched(false);
    }
  };

  // 연락처 자동 하이픈 삽입
  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const digits  = e.target.value.replace(/\D/g, "").slice(0, 11);
    let formatted = digits;
    if (digits.length > 7) {
      formatted = `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7)}`;
    } else if (digits.length > 3) {
      formatted = `${digits.slice(0, 3)}-${digits.slice(3)}`;
    }
    setForm((prev) => ({ ...prev, phone: formatted }));
    setErrorMessage("");
  };

  // 이메일 blur → 중복 검사
  const handleEmailBlur = async (): Promise<void> => {
    setEmailTouched(true);
    if (!EMAIL_REGEX.test(form.email)) return;
    setEmailCheckStatus("checking");
    try {
      const res = await fetch(
        `/api/auth/check-email?email=${encodeURIComponent(form.email)}`
      );
      const data: { available: boolean } = await res.json();
      setEmailCheckStatus(data.available ? "available" : "taken");
    } catch {
      setEmailCheckStatus("idle");
    }
  };

  // 폼 제출
  const handleSubmit = async (
    e: React.FormEvent<HTMLFormElement>
  ): Promise<void> => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage("");
    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data: { message: string } = await response.json();
      if (response.ok) {
        router.push("/board");
      } else {
        setErrorMessage(data.message);
      }
    } catch {
      setErrorMessage("네트워크 오류가 발생했습니다. 잠시 후 다시 시도해주세요.");
    } finally {
      setIsLoading(false);
    }
  };

  // 비밀번호 eye 토글 버튼 (Input suffix 슬롯에 삽입)
  const EyeToggle = (
    <button
      type="button"
      onClick={() => setShowPassword((prev) => !prev)}
      className="cursor-pointer text-gray-400 hover:text-gray-600"
      tabIndex={-1}
      aria-label={showPassword ? "비밀번호 숨기기" : "비밀번호 표시"}
    >
      {showPassword ? (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
        </svg>
      ) : (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
        </svg>
      )}
    </button>
  );

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-8 sm:px-0">
      <Card className="w-full max-w-sm">
        <h1 className="mb-6 text-center text-xl font-bold text-gray-900">
          회원가입
        </h1>

        <form onSubmit={handleSubmit} className="flex flex-col gap-1">
          {/* 이름 */}
          <Input
            label="이름"
            id="name"
            type="text"
            name="name"
            value={form.name}
            onChange={handleChange}
            onBlur={() => setNameTouched(true)}
            placeholder="이름을 입력하세요"
            required
            disabled={isLoading}
            error={nameError}
          />

          {/* 연락처 */}
          <Input
            label="연락처"
            id="phone"
            type="tel"
            name="phone"
            value={form.phone}
            onChange={handlePhoneChange}
            onBlur={() => setPhoneTouched(true)}
            placeholder="010-0000-0000"
            required
            disabled={isLoading}
            maxLength={13}
            error={phoneError}
            success={phoneSuccess}
          />

          {/* 이메일 */}
          <Input
            label="이메일"
            id="email"
            type="email"
            name="email"
            value={form.email}
            onChange={handleChange}
            onBlur={handleEmailBlur}
            placeholder="이메일을 입력하세요"
            required
            disabled={isLoading}
            error={emailError}
            success={emailSuccess}
            hint={emailHint}
          />

          {/* 비밀번호 */}
          <Input
            label="비밀번호"
            id="password"
            type={showPassword ? "text" : "password"}
            name="password"
            value={form.password}
            onChange={handleChange}
            onBlur={() => setPasswordTouched(true)}
            placeholder="비밀번호를 입력하세요 (8자 이상)"
            required
            disabled={isLoading}
            suffix={EyeToggle}
            error={passwordError}
            success={passwordSuccess}
          />

          {/* API 레벨 에러 메시지 */}
          <div className="h-5 mt-1">
            {errorMessage && (
              <p className="text-xs text-red-500">{errorMessage}</p>
            )}
          </div>

          {/* 회원가입 버튼: 모든 조건 충족 시 활성화 */}
          <Button
            type="submit"
            variant={isFormValid && !isLoading ? "primary" : "secondary"}
            size="lg"
            disabled={!isFormValid || isLoading}
            className="mt-1 w-full"
          >
            {isLoading ? "가입 중..." : "회원가입"}
          </Button>

          {/* 로그인 링크 */}
          <p className="mt-3 text-center text-sm text-gray-500">
            이미 계정이 있으신가요?{" "}
            <Link href="/login" className="font-medium text-blue-600 hover:underline">
              로그인
            </Link>
          </p>
        </form>
      </Card>
    </div>
  );
}
