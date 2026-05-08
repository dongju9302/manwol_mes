"use client";

// 공통 테이블 컴포넌트 모음 (named exports)
// AlignableTable: 정렬 편집모드 내장 범용 데이터 테이블
// 나머지 primitive 컴포넌트: 기존 사용처 호환 유지

import {
  useState,
  useEffect,
  useCallback,
  useRef,
  type ReactNode,
} from "react";

// ══ 정렬 관련 타입 ══════════════════════════════════════════════════

// 텍스트 정렬 값
export type AlignValue = "left" | "center" | "right";

// 컬럼 정의 — AlignableTable에 전달하는 컬럼 메타 정보
export interface ColumnDef {
  // 컬럼 식별 키 (renderCell의 columnKey와 일치)
  key: string;
  // 헤더에 표시할 내용 (문자열 또는 JSX — 체크박스 등 동적 내용 가능)
  label: ReactNode;
  // 기본 정렬 (미지정 시 center)
  defaultAlign?: AlignValue;
  // th와 td 모두에 적용할 추가 className (ex: "w-14", "hidden lg:table-cell")
  className?: string;
}

// AlignableTable props
export interface AlignableTableProps<T extends object> {
  // localStorage 저장 키 prefix — 테이블별 독립 저장
  tableId: string;
  columns: ColumnDef[];
  data: T[];
  // 셀 렌더링 함수 — columnKey와 row를 받아 ReactNode 반환
  renderCell: (columnKey: string, row: T, rowIndex: number) => ReactNode;
  // 행 key 추출 함수 (미지정 시 rowIndex 사용)
  getRowKey?: (row: T, index: number) => string | number;
  emptyMessage?: string;
  loading?: boolean;
  loadingMessage?: string;
  // thead tr에 적용할 배경·텍스트 스타일 (기본: 연회색 작은 대문자)
  theadClassName?: string;
  // tbody 행 사이 세로 구분선 표시 여부 (기본: false)
  rowDivide?: boolean;
}

// ── 정렬 관련 헬퍼 ────────────────────────────────────────────────

// 정렬값 → Tailwind 텍스트 정렬 클래스
function alignClass(align: AlignValue): string {
  if (align === "left") return "text-left";
  if (align === "right") return "text-right";
  return "text-center";
}

// ── SVG 아이콘 ────────────────────────────────────────────────────

// 정렬 아이콘 — 왼쪽/가운데/오른쪽 선 정렬 시각화
function AlignIcon({ align }: { align: AlignValue }) {
  if (align === "left") {
    return (
      // 왼쪽 정렬: 선 3개 모두 왼쪽 기준 시작
      <svg viewBox="0 0 16 16" fill="currentColor" className="h-3 w-3">
        <rect x="1" y="2" width="14" height="2" rx="1" />
        <rect x="1" y="6" width="9" height="2" rx="1" />
        <rect x="1" y="10" width="12" height="2" rx="1" />
      </svg>
    );
  }
  if (align === "right") {
    return (
      // 오른쪽 정렬: 선 3개 모두 오른쪽 기준 끝
      <svg viewBox="0 0 16 16" fill="currentColor" className="h-3 w-3">
        <rect x="1" y="2" width="14" height="2" rx="1" />
        <rect x="6" y="6" width="9" height="2" rx="1" />
        <rect x="3" y="10" width="12" height="2" rx="1" />
      </svg>
    );
  }
  return (
    // 가운데 정렬: 선 3개 모두 가운데 기준
    <svg viewBox="0 0 16 16" fill="currentColor" className="h-3 w-3">
      <rect x="1" y="2" width="14" height="2" rx="1" />
      <rect x="3.5" y="6" width="9" height="2" rx="1" />
      <rect x="2" y="10" width="12" height="2" rx="1" />
    </svg>
  );
}

// 톱니바퀴 아이콘 — 정렬 편집모드 버튼
function GearIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
      <path
        fillRule="evenodd"
        d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z"
        clipRule="evenodd"
      />
    </svg>
  );
}

// ══ AlignableTable 컴포넌트 ════════════════════════════════════════

// 정렬 설정 팝업 내장 범용 데이터 테이블
// - tableId별 독립적인 localStorage 정렬 저장
// - ⚙️ 버튼 클릭 시 팝업 표시: 컬럼별 왼쪽/가운데/오른쪽 선택
// - 팝업 외부 클릭 시 자동 닫힘
// - 테이블 본체 스타일 변동 없음
export function AlignableTable<T extends object>({
  tableId,
  columns,
  data,
  renderCell,
  getRowKey,
  emptyMessage = "데이터가 없습니다.",
  loading = false,
  loadingMessage = "불러오는 중...",
  // 게시판 테이블과 동일한 스타일을 기본값으로 통일
  theadClassName = "bg-gray-100 text-sm text-gray-600",
  rowDivide = true,
}: AlignableTableProps<T>) {
  // 컬럼별 정렬 설정 — 기본값으로 초기화 후 마운트 시 localStorage 로드
  const [aligns, setAligns] = useState<Record<string, AlignValue>>(() =>
    Object.fromEntries(columns.map((c) => [c.key, c.defaultAlign ?? "center"]))
  );
  // 팝업 표시 여부
  const [isPopupOpen, setIsPopupOpen] = useState<boolean>(false);

  // 팝업 div ref — 외부 클릭 감지용
  const popupRef = useRef<HTMLDivElement>(null);
  // ⚙️ 버튼 ref — 버튼 클릭을 외부 클릭으로 오인하지 않도록 제외
  const gearBtnRef = useRef<HTMLButtonElement>(null);

  // 초기 컬럼 ref — useEffect 내 stale closure 방지 (columns가 매 렌더 재생성돼도 안전)
  const initialColumnsRef = useRef(columns);

  // 마운트 후 localStorage에서 저장된 정렬 설정 로드
  useEffect(() => {
    const defaults = Object.fromEntries(
      initialColumnsRef.current.map((c) => [c.key, c.defaultAlign ?? "center"])
    );
    try {
      const raw = localStorage.getItem(`table_aligns_${tableId}`);
      if (raw) {
        // 저장값과 기본값 병합 — 새 컬럼 추가 시에도 기본값으로 보완
        setAligns({
          ...defaults,
          ...(JSON.parse(raw) as Record<string, AlignValue>),
        });
      }
    } catch {
      // localStorage 접근 실패 시 기본값 유지
    }
  }, [tableId]);

  // 팝업 외부 클릭 시 닫기
  // ⚙️ 버튼 클릭은 onClick에서 토글로 처리하므로 여기서 제외
  useEffect(() => {
    if (!isPopupOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (
        popupRef.current &&
        !popupRef.current.contains(e.target as Node) &&
        gearBtnRef.current &&
        !gearBtnRef.current.contains(e.target as Node)
      ) {
        setIsPopupOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isPopupOpen]);

  // 특정 컬럼 정렬값 변경 + localStorage 즉시 저장
  const handleAlignChange = useCallback(
    (key: string, value: AlignValue): void => {
      setAligns((prev) => {
        const next = { ...prev, [key]: value };
        try {
          localStorage.setItem(`table_aligns_${tableId}`, JSON.stringify(next));
        } catch {
          // localStorage 쓰기 실패 시 무시
        }
        return next;
      });
    },
    [tableId]
  );

  // 로딩 상태 렌더링
  if (loading) {
    return (
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="py-16 text-center text-sm text-gray-400">
          {loadingMessage}
        </div>
      </div>
    );
  }

  // rowDivide 옵션에 따른 세로 구분선 클래스
  const thDivideClass = rowDivide ? "divide-x divide-gray-200" : "";
  const tdDivideClass = rowDivide ? "divide-x divide-gray-100" : "";

  return (
    <div>
      {/* ── ⚙️ 버튼 행 — 테이블 우측 상단 ── */}
      {/* relative: 팝업(absolute)의 기준점 */}
      <div className="relative mb-1 flex justify-end">
        <button
          ref={gearBtnRef}
          type="button"
          onClick={() => setIsPopupOpen((prev) => !prev)}
          title={isPopupOpen ? "정렬 설정 닫기" : "컬럼 정렬 설정"}
          className={`cursor-pointer transition-colors ${
            isPopupOpen ? "text-blue-500" : "text-gray-300 hover:text-gray-500"
          }`}
        >
          <GearIcon />
        </button>

        {/* ── 정렬 설정 팝업 ──
            top-full mt-1: ⚙️ 버튼 바로 아래
            right-0: 우측 정렬
            z-50: 테이블 및 다른 요소 위에 표시 */}
        {isPopupOpen && (
          <div
            ref={popupRef}
            className="absolute right-0 top-full z-50 mt-1 w-64 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-lg"
          >
            {/* 팝업 헤더 */}
            <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
              <span className="text-sm font-semibold text-gray-700">
                컬럼 정렬 설정
              </span>
              {/* 닫기 버튼 */}
              <button
                type="button"
                onClick={() => setIsPopupOpen(false)}
                className="cursor-pointer text-gray-400 hover:text-gray-600"
                title="닫기"
              >
                <svg
                  className="h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            {/* 컬럼 목록 */}
            <div className="p-2">
              {columns.map((col) => {
                // 팝업 표시용 레이블 — JSX(체크박스 등)는 key를 대신 표시
                const displayLabel =
                  typeof col.label === "string" ? col.label : col.key;

                return (
                  <div
                    key={col.key}
                    className="flex items-center justify-between rounded-lg px-2 py-1.5 hover:bg-gray-50"
                  >
                    {/* 컬럼명 */}
                    <span className="min-w-0 flex-1 truncate text-sm text-gray-600">
                      {displayLabel}
                    </span>

                    {/* 정렬 선택 버튼 3개 */}
                    <div className="ml-2 flex shrink-0 gap-0.5">
                      {(["left", "center", "right"] as AlignValue[]).map(
                        (val) => (
                          <button
                            key={val}
                            type="button"
                            onClick={() => handleAlignChange(col.key, val)}
                            title={
                              val === "left"
                                ? "왼쪽"
                                : val === "center"
                                  ? "가운데"
                                  : "오른쪽"
                            }
                            // 현재 선택된 정렬 강조, 나머지는 연하게
                            className={`flex h-6 w-6 cursor-pointer items-center justify-center rounded transition-colors ${
                              aligns[col.key] === val
                                ? "bg-blue-600 text-white"
                                : "text-gray-300 hover:bg-gray-100 hover:text-gray-600"
                            }`}
                          >
                            <AlignIcon align={val} />
                          </button>
                        )
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* ── 테이블 카드 — 정렬 설정과 무관하게 스타일 변동 없음 ── */}
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        {/* 빈 상태 메시지 */}
        {data.length === 0 ? (
          <div className="py-16 text-center text-sm text-gray-400">
            {emptyMessage}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr
                  className={`border-b border-gray-200 ${theadClassName} ${thDivideClass}`}
                >
                  {columns.map((col) => (
                    <th
                      key={col.key}
                      className={`whitespace-nowrap px-4 py-3 text-center font-medium ${col.className ?? ""}`}
                    >
                      {/* 컬럼 레이블 (문자열 또는 JSX) */}
                      <div className="flex justify-center">{col.label}</div>
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-100">
                {data.map((row, index) => (
                  <tr
                    key={getRowKey ? getRowKey(row, index) : index}
                    className={`transition-colors hover:bg-gray-50 ${tdDivideClass}`}
                  >
                    {columns.map((col) => (
                      <td
                        key={col.key}
                        className={`px-4 py-3 text-sm ${alignClass(
                          aligns[col.key] ?? "center"
                        )} ${col.className ?? ""}`}
                      >
                        {renderCell(col.key, row, index)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

// ══ 기존 primitive 컴포넌트 (기존 사용처 호환 유지) ══════════════════

// ── 외부 래퍼 ────────────────────────────────────────────────────────

// 테이블 전체를 감싸는 카드 스타일 컨테이너
// border + rounded + shadow + overflow-hidden (모서리 클리핑)
export function TableWrapper({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={[
        "overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm",
        className,
      ].join(" ")}
    >
      {children}
    </div>
  );
}

// ── 빈 상태 메시지 ────────────────────────────────────────────────

// 데이터가 없을 때 중앙 안내 문구
export function TableEmpty({ message }: { message: string }) {
  return (
    <div className="py-16 text-center text-sm text-gray-400">{message}</div>
  );
}

// ── 로딩 상태 ────────────────────────────────────────────────────

// 데이터 로딩 중 안내 문구
export function TableLoading({
  message = "불러오는 중...",
}: {
  message?: string;
}) {
  return (
    <div className="py-16 text-center text-sm text-gray-400">{message}</div>
  );
}

// ── table 요소 ───────────────────────────────────────────────────

// 가로 스크롤 가능한 테이블 래퍼
export function Table({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className="overflow-x-auto">
      <table className={["w-full", className].filter(Boolean).join(" ")}>
        {children}
      </table>
    </div>
  );
}

// ── thead 요소 ───────────────────────────────────────────────────

export function Thead({ children }: { children: ReactNode }) {
  return <thead>{children}</thead>;
}

// thead 내 표준 tr — 회색 배경, 구분선
export function TheadRow({ children }: { children: ReactNode }) {
  return (
    <tr className="border-b border-gray-200 bg-gray-50 text-xs font-semibold uppercase tracking-wide text-gray-500">
      {children}
    </tr>
  );
}

// th 셀: 기본 패딩 통일
export function Th({
  children,
  className = "",
}: {
  children?: ReactNode;
  className?: string;
}) {
  return (
    <th
      className={["px-4 py-3 font-medium whitespace-nowrap", className].filter(Boolean).join(" ")}
    >
      {children}
    </th>
  );
}

// ── tbody 요소 ───────────────────────────────────────────────────

export function Tbody({ children }: { children: ReactNode }) {
  return <tbody className="divide-y divide-gray-100">{children}</tbody>;
}

// tbody 내 표준 tr — 호버 효과
export function Tr({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <tr
      className={["transition-colors hover:bg-gray-50", className]
        .filter(Boolean)
        .join(" ")}
    >
      {children}
    </tr>
  );
}

// td 셀: 기본 패딩, 텍스트 크기 통일
export function Td({
  children,
  className = "",
}: {
  children?: ReactNode;
  className?: string;
}) {
  return (
    <td
      className={["px-4 py-3 text-sm text-gray-700", className]
        .filter(Boolean)
        .join(" ")}
    >
      {children}
    </td>
  );
}
