// 메인 홈 페이지 — 서버 컴포넌트
// 로그인 후 첫 진입 화면: 서비스명 + 통합검색 입력창 (UI만, 검색 기능 미구현)
// proxy.ts에서 미로그인 시 /login으로 자동 리다이렉트
export default function HomePage() {
  return (
    // 전체 영역 가운데 정렬 (LayoutProvider의 main 안에 렌더링됨)
    <div className="flex min-h-full flex-col items-center justify-center px-4 py-16">
      {/* 서비스 제목 */}
      <h1 className="mb-10 text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl">
        Manwol{" "}
        <span className="text-blue-600">MES</span>
      </h1>

      {/* 통합검색 입력창 — 구글 검색창처럼 넓고 심플하게 */}
      <div className="w-full max-w-2xl">
        <div className="relative flex items-center">
          {/* 돋보기 아이콘 */}
          <svg
            className="absolute left-4 h-5 w-5 text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>

          {/* 검색 입력창 */}
          <input
            type="search"
            placeholder="통합 검색"
            // 기능 미구현 — readOnly로 표시만
            readOnly
            className="w-full rounded-full border border-gray-300 bg-white py-3.5 pl-12 pr-6 text-sm text-gray-900 shadow-sm outline-none placeholder:text-gray-400 transition-shadow hover:shadow-md focus:border-blue-400 focus:shadow-md focus:ring-2 focus:ring-blue-100 cursor-text"
          />
        </div>

        {/* 검색 기능 미구현 안내 */}
        <p className="mt-3 text-center text-xs text-gray-300">
          통합검색은 준비 중입니다
        </p>
      </div>
    </div>
  );
}
