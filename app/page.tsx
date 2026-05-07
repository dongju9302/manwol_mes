import Link from "next/link";

// 홈 화면 컴포넌트: 로그인 페이지로 이동하는 버튼을 화면 중앙에 표시
export default function Home() {
  return (
    // 화면 전체 높이를 차지하며 콘텐츠를 가운데 정렬
    <div className="flex h-screen items-center justify-center">
      {/* 로그인 페이지로 이동하는 링크 버튼 */}
      <Link
        href="/login"
        className="rounded-lg bg-blue-600 px-6 py-3 text-white hover:bg-blue-700"
      >
        로그인 페이지로 이동
      </Link>
    </div>
  );
}
