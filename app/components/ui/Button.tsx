// 공통 버튼 컴포넌트
// variant: primary(파랑) / secondary(회색 테두리) / danger(빨강) / ghost(배경 없음)
// size: sm(xs) / md(sm, 기본) / lg(sm, 넓은 터치 영역)
// <button> 기본 속성 모두 상속 (type, onClick, disabled 등)

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  // 버튼 색상·스타일 (기본: primary)
  variant?: "primary" | "secondary" | "danger" | "ghost";
  // 버튼 크기 (기본: md)
  size?: "sm" | "md" | "lg";
  children: React.ReactNode;
}

// variant별 색상 클래스
const VARIANT_CLASSES: Record<NonNullable<ButtonProps["variant"]>, string> = {
  primary:
    "bg-blue-600 text-white hover:bg-blue-700 disabled:bg-blue-300",
  secondary:
    "border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 disabled:bg-gray-50 disabled:text-gray-300",
  danger:
    "bg-red-500 text-white hover:bg-red-600 disabled:bg-red-300",
  ghost:
    "text-gray-500 hover:bg-gray-100 hover:text-gray-700 disabled:opacity-40",
};

// size별 패딩·폰트 클래스
const SIZE_CLASSES: Record<NonNullable<ButtonProps["size"]>, string> = {
  // 작은 버튼: 테이블 인라인 액션 등
  sm: "px-3 py-1.5 text-xs",
  // 기본 버튼: 필터, 폼 제출 등
  md: "min-h-[36px] px-4 py-2 text-sm",
  // 큰 버튼: 모바일 터치 친화적 (최소 44px)
  lg: "min-h-[44px] px-5 py-2.5 text-sm",
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
        // 공통 기본 스타일: 인라인 플렉스, 둥근 모서리, 전환 효과
        // transition-all: scale·opacity·color 변화 모두 커버
        // active:scale/opacity: 모바일 터치 시 살짝 눌리는 피드백
        // disabled:active: disabled 상태에서 active 효과 리셋
        "inline-flex cursor-pointer items-center justify-center rounded-md font-medium transition-all duration-100",
        "active:scale-[0.98] active:opacity-90",
        "disabled:cursor-not-allowed disabled:active:scale-100 disabled:active:opacity-100",
        VARIANT_CLASSES[variant],
        SIZE_CLASSES[size],
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {children}
    </button>
  );
}
