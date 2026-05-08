// 공통 배지 컴포넌트
// 권한(master/admin/user)·상태(active/inactive) 표시에 사용
// 각 variant별 배경·텍스트·테두리 색상을 통일

// 지원하는 배지 variant 목록
export type BadgeVariant =
  | "master"
  | "admin"
  | "user"
  | "active"
  | "inactive"
  | "default";

interface BadgeProps {
  // 색상 스타일 (기본: default)
  variant?: BadgeVariant;
  children: React.ReactNode;
  className?: string;
}

// variant별 Tailwind 클래스
const BADGE_STYLE: Record<BadgeVariant, string> = {
  // master: 보라색 (최고 권한 강조)
  master:   "bg-purple-50 text-purple-700 border border-purple-200",
  // admin: 파란색
  admin:    "bg-blue-50 text-blue-700 border border-blue-100",
  // user: 회색 (기본 역할)
  user:     "bg-gray-50 text-gray-500 border border-gray-200",
  // active: 초록 (활성 계정)
  active:   "bg-green-50 text-green-700 border border-green-200",
  // inactive: 빨간 (비활성 계정)
  inactive: "bg-red-50 text-red-600 border border-red-200",
  // default: 중립 회색
  default:  "bg-gray-100 text-gray-500 border border-gray-200",
};

export default function Badge({
  variant = "default",
  children,
  className = "",
}: BadgeProps) {
  return (
    <span
      className={[
        "inline-flex items-center rounded px-1.5 py-0.5 text-xs font-medium",
        BADGE_STYLE[variant],
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {children}
    </span>
  );
}
