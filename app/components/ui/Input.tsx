// 공통 입력 컴포넌트
// label: 레이블 텍스트 (선택)
// error: 빨간 에러 메시지 + 빨간 테두리
// success: 초록 성공 메시지 + 초록 테두리
// hint: 회색 안내 텍스트 (error/success 없을 때만 표시)
// suffix: 오른쪽 슬롯 (비밀번호 eye 아이콘 등)
// 나머지 props는 <input>에 그대로 전달

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  success?: string;
  hint?: string;
  // 입력 필드 오른쪽에 렌더링할 요소 (eye 토글 버튼 등)
  suffix?: React.ReactNode;
}

export default function Input({
  label,
  error,
  success,
  hint,
  suffix,
  id,
  className = "",
  ...props
}: InputProps) {
  // id가 없으면 label을 기반으로 자동 생성
  const inputId = id ?? label?.toLowerCase().replace(/\s+/g, "-");

  // 상태별 테두리·포커스 링 클래스
  const borderClass = error
    ? "border-red-400 focus:border-red-400 focus:ring-red-200"
    : success
      ? "border-green-500 focus:border-green-500 focus:ring-green-200"
      : "border-gray-200 focus:border-blue-500 focus:ring-blue-100";

  return (
    <div className="flex flex-col gap-1">
      {/* 레이블 */}
      {label && (
        <label
          htmlFor={inputId}
          className="text-sm font-medium text-gray-700"
        >
          {label}
        </label>
      )}

      {/* 입력 필드 + suffix */}
      <div className="relative">
        <input
          id={inputId}
          className={[
            "w-full rounded-md border px-3 py-2 text-sm text-gray-900 outline-none placeholder:text-gray-400 transition-colors focus:ring-1",
            "disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-400",
            borderClass,
            // suffix가 있으면 오른쪽 패딩 확보
            suffix ? "pr-10" : "",
            className,
          ]
            .filter(Boolean)
            .join(" ")}
          {...props}
        />
        {/* 오른쪽 슬롯: eye 버튼 등 */}
        {suffix && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            {suffix}
          </div>
        )}
      </div>

      {/* 하단 메시지 영역 (고정 높이 유지로 레이아웃 변경 방지) */}
      <div className="h-4">
        {error ? (
          <p className="text-xs text-red-500">{error}</p>
        ) : success ? (
          <p className="text-xs text-green-600">{success}</p>
        ) : hint ? (
          <p className="text-xs text-gray-400">{hint}</p>
        ) : null}
      </div>
    </div>
  );
}
