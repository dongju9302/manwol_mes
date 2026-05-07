// 공통 버튼 컴포넌트 — variant와 size로 스타일을 통일
// <button> 기본 속성을 모두 상속하므로 type, onClick, disabled 등 그대로 사용 가능

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  // 버튼 색상 스타일 (기본: primary)
  variant?: "primary" | "secondary" | "danger";
  // 버튼 크기 (기본: md)
  size?: "sm" | "md";
  children: React.ReactNode;
}

// variant별 색상 클래스
const VARIANT_CLASSES: Record<NonNullable<ButtonProps["variant"]>, string> = {
  // 파란색 — 주요 액션 (저장, 확인 등)
  primary:
    "bg-blue-600 text-white hover:bg-blue-700 disabled:bg-blue-400",
  // 회색 테두리 — 보조 액션 (취소, 필터 등)
  secondary:
    "border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 disabled:bg-gray-100 disabled:text-gray-400",
  // 빨간색 — 삭제, 위험 액션
  danger:
    "bg-red-500 text-white hover:bg-red-600 disabled:bg-red-300",
};

// size별 패딩·폰트 클래스
const SIZE_CLASSES: Record<NonNullable<ButtonProps["size"]>, string> = {
  // 작은 버튼 — 인라인, 테이블 내 액션
  sm: "px-3 py-1.5 text-xs",
  // 기본 버튼 — 폼 제출, 필터 등
  md: "px-4 py-2 text-sm",
};

export default function Button({
  variant = "primary",
  size = "md",
  className = "",
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      {...props}
      className={[
        // 공통 기본 스타일
        "rounded-lg font-medium transition-colors disabled:cursor-not-allowed",
        VARIANT_CLASSES[variant],
        SIZE_CLASSES[size],
        // 외부에서 전달한 추가 클래스 (너비 등 오버라이드 가능)
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {children}
    </button>
  );
}
