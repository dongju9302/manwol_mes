"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import Button from "@/app/components/Button";

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

// 게시판 필터 + 테이블 — 클라이언트 컴포넌트
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

  // 지정된 ID 목록을 순차 삭제 후 로컬 목록에서 제거
  const deletePosts = async (ids: number[]): Promise<void> => {
    setIsDeleting(true);
    try {
      // 병렬 DELETE 호출
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

  return (
    <div>
      {/* 필터 버튼 + 삭제 액션 버튼 (내글만 선택 시 표시) */}
      <div className="mb-3 flex items-center justify-between">
        {/* 좌측: 필터 버튼 */}
        <div className="flex gap-2">
          {(["all", "mine"] as FilterType[]).map((f) => (
            <Button
              key={f}
              variant={filter === f ? "primary" : "secondary"}
              onClick={() => handleFilterChange(f)}
            >
              {f === "all" ? "전체글" : "내글만"}
            </Button>
          ))}
        </div>

        {/* 우측: 삭제 버튼 (내글만일 때 항상 표시) */}
        {isMineFilter && filteredPosts.length > 0 && (
          <Button
            variant="danger"
            onClick={handleDeleteSelected}
            disabled={isDeleting || checkedIds.size === 0}
          >
            {allChecked ? "전체삭제" : "선택삭제"}
          </Button>
        )}
      </div>

      {/* 게시글 테이블 */}
      <div className="overflow-hidden rounded-xl border border-gray-200 shadow-sm">
        {filteredPosts.length === 0 ? (
          <div className="bg-white py-16 text-center text-sm text-gray-400">
            {isMineFilter
              ? "작성한 게시글이 없습니다."
              : "아직 게시글이 없습니다. 첫 글을 작성해보세요!"}
          </div>
        ) : (
          <table className="w-full table-fixed">
            <colgroup>
              {/* 번호/체크박스 열 */}
              <col className="w-14" />
              {/* 제목 열 */}
              <col />
              <col className="w-24" />
              <col className="w-16" />
              <col className="w-14" />
              <col className="w-14" />
              <col className="w-28" />
            </colgroup>

            <thead>
              <tr className="divide-x divide-gray-200 border-b border-gray-200 bg-gray-100 text-sm text-gray-600">
                {/* 전체글: 번호 / 내글만: 전체선택 체크박스 */}
                <th className="h-12 text-center font-medium">
                  {isMineFilter ? (
                    <input
                      ref={headerCheckboxRef}
                      type="checkbox"
                      checked={allChecked}
                      onChange={toggleAll}
                      className="h-4 w-4 cursor-pointer rounded border-gray-300 accent-blue-600"
                    />
                  ) : (
                    "번호"
                  )}
                </th>
                <th className="h-12 text-center font-medium">제목</th>
                <th className="h-12 text-center font-medium">작성자</th>
                <th className="h-12 text-center font-medium">조회수</th>
                <th className="h-12 text-center font-medium">👍</th>
                <th className="h-12 text-center font-medium">👎</th>
                <th className="h-12 text-center font-medium">작성일</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-100 bg-white">
              {filteredPosts.map((post, index) => (
                <tr
                  key={post.id}
                  className="divide-x divide-gray-100 transition-colors hover:bg-gray-50"
                >
                  {/* 번호(전체글): 현재 목록 순서 기준 1번부터 표시 (DB id 아님) */}
                  {/* 체크박스(내글만): 선택 삭제용 */}
                  <td className="h-12 text-center text-sm text-gray-400">
                    {isMineFilter ? (
                      <input
                        type="checkbox"
                        checked={checkedIds.has(post.id)}
                        onChange={() => toggleCheck(post.id)}
                        className="h-4 w-4 cursor-pointer rounded border-gray-300 accent-blue-600"
                      />
                    ) : (
                      index + 1
                    )}
                  </td>

                  {/* 제목 */}
                  <td className="h-12 px-3 text-left">
                    <Link
                      href={`/board/${post.id}`}
                      className="block truncate text-sm font-medium text-gray-800 hover:text-blue-600"
                    >
                      {post.title}
                    </Link>
                  </td>

                  {/* 작성자 */}
                  <td className="h-12 text-center text-sm text-gray-500">
                    {post.author_name}
                  </td>

                  {/* 조회수 */}
                  <td className="h-12 text-center text-sm text-gray-500">
                    {post.view_count}
                  </td>

                  {/* 좋아요 */}
                  <td className="h-12 text-center text-sm text-blue-500">
                    {parseInt(post.like_count, 10)}
                  </td>

                  {/* 싫어요 */}
                  <td className="h-12 text-center text-sm text-red-400">
                    {parseInt(post.dislike_count, 10)}
                  </td>

                  {/* 작성일 */}
                  <td className="h-12 text-center text-sm text-gray-400">
                    {formatDate(post.created_at)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
