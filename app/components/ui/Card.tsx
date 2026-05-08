// 공통 카드 컨테이너 컴포넌트
// 흰색 배경, 연한 회색 테두리, 최소 그림자
// padding: true(기본) → p-6 패딩 적용
// padding: false → overflow-hidden만 적용 (테이블 등 full-bleed 콘텐츠용)

interface CardProps {
  children: React.ReactNode;
  className?: string;
  // true: 내부 패딩 p-6 적용 / false: overflow-hidden만 (테이블 래퍼용)
  padding?: boolean;
}

export default function Card({
  children,
  className = "",
  padding = true,
}: CardProps) {
  return (
    <div
      className={[
        "rounded-xl border border-gray-200 bg-white shadow-sm",
        padding ? "p-6" : "overflow-hidden",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {children}
    </div>
  );
}
