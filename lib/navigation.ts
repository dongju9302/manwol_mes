// ──────────────────────────────────────────
// 내비게이션 구조 정의 파일
// 메뉴 추가·수정 시 이 파일만 수정하면 Header·Sidebar 전체에 반영됨
// ──────────────────────────────────────────

// 소분류: Sidebar에 표시 (현재 미사용 — 추후 각 중분류 하위에 추가)
export interface SubItem {
  // 메뉴 레이블
  label: string;
  // 이동 경로
  href: string;
  // true: master 역할에만 표시
  masterOnly?: boolean;
}

// 중분류: Header 드롭다운에 표시
export interface MenuItem {
  // 메뉴 레이블
  label: string;
  // 이동 경로
  href: string;
  // true: master 역할에만 표시
  masterOnly?: boolean;
  // 소분류 목록 (Sidebar 에 표시 — 빈 배열이면 Sidebar 미노출)
  subItems?: SubItem[];
}

// 대분류: Header 최상단 카테고리
export interface NavCategory {
  // 카테고리 레이블
  label: string;
  // 고유 키 (드롭다운 상태 식별)
  key: string;
  // 중분류 목록 (빈 배열이면 드롭다운 없음)
  items: MenuItem[];
}

// ──────────────────────────────────────────
// 전체 내비게이션 구조
// 대분류 → 중분류 → 소분류 3단계 계층 구조
// ──────────────────────────────────────────
export const NAV_CATEGORIES: NavCategory[] = [
  {
    label: "재고",
    key: "inventory",
    // 중분류 준비 중 — 추후 항목 추가
    items: [],
  },
  {
    label: "회계",
    key: "accounting",
    // 중분류 준비 중 — 추후 항목 추가
    items: [],
  },
  {
    label: "관리",
    key: "management",
    items: [
      {
        label: "계정관리",
        href: "/admin",
        // master 전용 메뉴 (권한 설정은 계정관리 페이지 내 탭으로 통합)
        masterOnly: true,
        subItems: [],
      },
    ],
  },
  {
    label: "커뮤니티",
    key: "community",
    items: [
      {
        label: "게시판",
        href: "/board",
        masterOnly: false,
        // 소분류 준비 중 — 추후 목록/글쓰기 등 추가
        subItems: [],
      },
    ],
  },
];
