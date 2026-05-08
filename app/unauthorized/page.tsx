import Link from "next/link";

// 권한 없음 안내 페이지 — 서버 컴포넌트
// proxy.ts에서 권한 부족 시 이 페이지로 리다이렉트
export default function UnauthorizedPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="text-center">
        {/* 에러 코드 */}
        <p className="mb-2 text-6xl font-bold text-gray-200">403</p>

        {/* 안내 제목 */}
        <h1 className="mb-3 text-xl font-bold text-gray-800">
          접근 권한이 없습니다
        </h1>

        {/* 안내 설명 */}
        <p className="mb-8 text-sm leading-relaxed text-gray-500">
          이 페이지에 접근할 권한이 없습니다.
          <br />
          관리자에게 권한을 요청하거나 다른 페이지로 이동해주세요.
        </p>

        {/* 게시판으로 이동 버튼 */}
        <Link
          href="/board"
          className="inline-flex min-h-[44px] items-center rounded-lg bg-blue-600 px-6 py-2 text-sm font-semibold text-white hover:bg-blue-700"
        >
          게시판으로 이동
        </Link>
      </div>
    </div>
  );
}
