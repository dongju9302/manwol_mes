"use client";

import { useState, useRef, useEffect, type ReactNode } from "react";
import Link from "next/link";
import Button from "@/app/components/Button";
import { AlignableTable, type ColumnDef } from "@/app/components/ui/Table";

// 서버에서 전달받는 게시글 타입
export interface Post {
  id: number;
  title: string;
  author_name: string;
  // 내글만 필터 판별에 사용
  user_id: number;
  view_count: number;
  // COUNT 결과 — pg에서 문자열로 반환
  like_count: string;
  dislike_count: string;
  created_at: string;
}

type FilterType = "all" | "mine";

interface BoardFilterProps {
  posts: Post[];
  currentUserId: number;
}

// 날짜 문자열을 YYYY.MM.DD 형식으로 변환
function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}.${mm}.${dd}`;
}

// 게시판 필터 + 목록 — 클라이언트 컴포넌트
// 모바일(md 미만): 카드 형식
// 태블릿/데스크탑(md 이상): AlignableTable (⚙️ 정렬 편집 내장)
export default function BoardFilter({ posts, currentUserId }: BoardFilterProps) {
  // 현재 선택된 필터 (기본: 전체글)
  const [filter, setFilter] = useState<FilterType>("all");
  // 낙관적 업데이트를 위한 로컬 게시글 목록
  const [postList, setPostList] = useState<Post[]>(posts);
  // 체크된 게시글 ID 집합
  const [checkedIds, setCheckedIds] = useState<Set<number>>(new Set());
  // 삭제 API 호출 중 여부
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  const isMineFilter = filter === "mine";

  // 현재 필터에 따라 표시할 게시글
  const filteredPosts = isMineFilter
    ? postList.filter((p) => p.user_id === currentUserId)
    : postList;

  // 전체선택 체크박스 상태 계산
  const allChecked =
    filteredPosts.length > 0 &&
    filteredPosts.every((p) => checkedIds.has(p.id));
  const someChecked = filteredPosts.some((p) => checkedIds.has(p.id));
  const isIndeterminate = someChecked && !allChecked;

  // 헤더 체크박스 indeterminate 속성은 JS로만 설정 가능
  const headerCheckboxRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (headerCheckboxRef.current) {
      headerCheckboxRef.current.indeterminate = isIndeterminate;
    }
  }, [isIndeterminate]);

  // 필터 전환 시 선택 초기화
  const handleFilterChange = (next: FilterType): void => {
    setFilter(next);
    setCheckedIds(new Set());
  };

  // 개별 체크박스 토글
  const toggleCheck = (id: number): void => {
    setCheckedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  // 헤더 전체선택/해제 토글
  const toggleAll = (): void => {
    setCheckedIds(
      allChecked ? new Set() : new Set(filteredPosts.map((p) => p.id))
    );
  };

  // 지정된 ID 목록을 병렬 삭제 후 로컬 목록에서 제거
  const deletePosts = async (ids: number[]): Promise<void> => {
    setIsDeleting(true);
    try {
      await Promise.all(
        ids.map((id) => fetch(`/api/posts/${id}`, { method: "DELETE" }))
      );
      setPostList((prev) => prev.filter((p) => !ids.includes(p.id)));
      setCheckedIds(new Set());
    } finally {
      setIsDeleting(false);
    }
  };

  // 선택삭제: 체크된 항목 삭제 (전체 선택 시 "전체삭제"로 표시)
  const handleDeleteSelected = async (): Promise<void> => {
    if (checkedIds.size === 0) return;
    const label = allChecked ? "전체" : `선택한 ${checkedIds.size}개의`;
    if (!confirm(`${label} 게시글을 삭제하시겠습니까?`)) return;
    await deletePosts([...checkedIds]);
  };

  // 빈 목록 안내 문구
  const emptyMessage = isMineFilter
    ? "작성한 게시글이 없습니다."
    : "아직 게시글이 없습니다. 첫 글을 작성해보세요!";

  // ── AlignableTable 컬럼 정의 ─────────────────────────────────────
  // isMineFilter에 따라 번호 컬럼 레이블 동적 구성 (체크박스 또는 "번호" 텍스트)
  const columns: ColumnDef[] = [
    {
      key: "no",
      label: isMineFilter ? (
        // 내글만 모드: 전체선택 체크박스를 레이블로 사용
        <input
          ref={headerCheckboxRef}
          type="checkbox"
          checked={allChecked}
          onChange={toggleAll}
          className="h-4 w-4 cursor-pointer rounded border-gray-300 accent-blue-600"
        />
      ) : (
        "번호"
      ),
      defaultAlign: "center",
      className: "w-14",
    },
    { key: "title",     label: "제목",   defaultAlign: "left"   },
    { key: "author",    label: "작성자", defaultAlign: "center", className: "w-24" },
    { key: "viewCount", label: "조회수", defaultAlign: "center", className: "hidden lg:table-cell w-16" },
    { key: "like",      label: "👍",     defaultAlign: "center", className: "hidden lg:table-cell w-14" },
    { key: "dislike",   label: "👎",     defaultAlign: "center", className: "hidden lg:table-cell w-14" },
    { key: "createdAt", label: "작성일", defaultAlign: "center", className: "w-28" },
  ];

  // ── AlignableTable 셀 렌더링 함수 ────────────────────────────────
  // columnKey에 따라 각 셀 JSX를 반환
  const renderCell = (key: string, post: Post, index: number): ReactNode => {
    switch (key) {
      case "no":
        // 내글만 모드: 체크박스 / 전체글 모드: 순번
        return isMineFilter ? (
          <input
            type="checkbox"
            checked={checkedIds.has(post.id)}
            onChange={() => toggleCheck(post.id)}
            className="h-4 w-4 cursor-pointer rounded border-gray-300 accent-blue-600"
          />
        ) : (
          <span className="text-gray-400">{index + 1}</span>
        );

      case "title":
        // 제목: 클릭 시 게시글 상세 이동, 긴 제목 말줄임
        return (
          <Link
            href={`/board/${post.id}`}
            className="block truncate font-medium text-gray-800 hover:text-blue-600"
          >
            {post.title}
          </Link>
        );

      case "author":
        return <span className="text-gray-500">{post.author_name}</span>;

      case "viewCount":
        return <span className="text-gray-500">{post.view_count}</span>;

      case "like":
        return (
          <span className="text-blue-500">
            {parseInt(post.like_count, 10)}
          </span>
        );

      case "dislike":
        return (
          <span className="text-red-400">
            {parseInt(post.dislike_count, 10)}
          </span>
        );

      case "createdAt":
        return (
          <span className="text-gray-400">{formatDate(post.created_at)}</span>
        );

      default:
        return null;
    }
  };

  return (
    <div>
      {/* 필터 버튼 + 삭제 버튼 */}
      <div className="mb-3 flex items-center justify-between">
        {/* 좌측: 전체글/내글만 필터 버튼 */}
        <div className="flex gap-2">
          {(["all", "mine"] as FilterType[]).map((f) => (
            <Button
              key={f}
              size="md"
              variant={filter === f ? "primary" : "secondary"}
              onClick={() => handleFilterChange(f)}
            >
              {f === "all" ? "전체글" : "내글만"}
            </Button>
          ))}
        </div>

        {/* 우측: 선택삭제 버튼 — 내글만 모드에서 1개 이상 선택 시에만 표시 */}
        {isMineFilter && checkedIds.size > 0 && (
          <Button
            variant="danger"
            onClick={handleDeleteSelected}
            disabled={isDeleting}
          >
            {allChecked ? "전체삭제" : "선택삭제"}
          </Button>
        )}
      </div>

      {/* ── 모바일 카드 목록 (md 미만) ── */}
      <div className="md:hidden">
        {filteredPosts.length === 0 ? (
          <div className="rounded-xl bg-white py-12 text-center text-sm text-gray-400">
            {emptyMessage}
          </div>
        ) : (
          <div className="space-y-2">
            {filteredPosts.map((post, index) => (
              // relative: 내글만 체크박스를 카드 오른쪽 위에 absolute 배치
              <div
                key={post.id}
                className="relative rounded-xl border border-gray-200 bg-white shadow-sm"
              >
                {/* 내글만 모드: 체크박스 (링크와 분리하여 별도 배치) */}
                {isMineFilter && (
                  <div className="absolute right-3 top-3 z-10">
                    <input
                      type="checkbox"
                      checked={checkedIds.has(post.id)}
                      onChange={() => toggleCheck(post.id)}
                      className="h-5 w-5 cursor-pointer rounded border-gray-300 accent-blue-600"
                    />
                  </div>
                )}

                {/* 카드 본문: 제목 클릭 시 게시글 상세로 이동 */}
                <Link href={`/board/${post.id}`} className="block p-4">
                  {/* 번호 */}
                  <span className="text-xs text-gray-400">{index + 1}</span>

                  {/* 제목: 내글만 모드에서 체크박스와 겹치지 않도록 우측 패딩 */}
                  <p
                    className={`mt-0.5 text-sm font-semibold text-gray-800 ${
                      isMineFilter ? "pr-8" : ""
                    }`}
                  >
                    {post.title}
                  </p>

                  {/* 메타 정보: 작성자 · 조회수 · 좋아요 · 싫어요 · 날짜 */}
                  <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-500">
                    <span>{post.author_name}</span>
                    <span>조회 {post.view_count}</span>
                    <span className="text-blue-500">
                      👍 {parseInt(post.like_count, 10)}
                    </span>
                    <span className="text-red-400">
                      👎 {parseInt(post.dislike_count, 10)}
                    </span>
                    <span>{formatDate(post.created_at)}</span>
                  </div>
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── 태블릿/데스크탑 테이블 (md 이상) — AlignableTable 사용 ── */}
      <div className="hidden md:block">
        <AlignableTable
          tableId="board"
          columns={columns}
          data={filteredPosts}
          renderCell={renderCell}
          getRowKey={(post) => post.id}
          emptyMessage={emptyMessage}
          // theadClassName·rowDivide는 AlignableTable 기본값과 동일하므로 생략
        />
      </div>
    </div>
  );
}
