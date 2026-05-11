import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 개발 모드에서 화면 하단에 표시되는 Next.js "N" 로고 인디케이터 비활성화
  devIndicators: false,
  // Docker 배포용 standalone 출력 모드: node_modules 의존성을 최소화한 독립 실행 번들 생성
  output: "standalone",
};

export default nextConfig;
