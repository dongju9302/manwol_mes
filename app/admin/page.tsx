"use client";

import { useEffect, useState, useCallback, type ReactNode } from "react";
import Button from "@/app/components/ui/Button";
import Badge, { type BadgeVariant } from "@/app/components/ui/Badge";
import Modal from "@/app/components/ui/Modal";
import Tabs, { type Tab } from "@/app/components/ui/Tabs";
import { AlignableTable, type ColumnDef } from "@/app/components/ui/Table";

// ── 타입 정의 ──────────────────────────────────────────────────

interface UserRow {
  id: number;
  name: string;
  email: string;
  role: string;
  is_active: boolean;
  created_at: string;
}

interface PermissionRow {
  id: number;
  page_path: string;
  page_name: string;
  admin_access: boolean;
  user_access: boolean;
}

// 모달 상태 타입 (null이면 모달 미표시)
interface ModalState {
  title: string;
  message: string;
  onConfirm: () => void;
}

type TabKey = "users" | "permissions";

// ── 상수 ───────────────────────────────────────────────────────

const ROLES = ["master", "admin", "user"] as const;

// 탭 목록
const TABS: Tab[] = [
  { key: "users",       label: "계정 목록" },
  { key: "permissions", label: "권한 설정" },
];

// 계정 목록 테이블 컬럼 정의
const USER_COLUMNS: ColumnDef[] = [
  { key: "name",       label: "이름",      defaultAlign: "left"   },
  { key: "email",      label: "이메일",    defaultAlign: "left"   },
  // 역할: 태블릿 이상에서만 표시
  { key: "role",       label: "역할",      defaultAlign: "center", className: "hidden md:table-cell" },
  // 가입일: 데스크탑 이상에서만 표시
  { key: "created_at", label: "가입일",    defaultAlign: "center", className: "hidden lg:table-cell" },
  { key: "is_active",  label: "활성화",    defaultAlign: "center" },
  { key: "delete",     label: "삭제",      defaultAlign: "center" },
];

// 권한 설정 테이블 컬럼 정의
const PERM_COLUMNS: ColumnDef[] = [
  { key: "page_name",    label: "페이지",      defaultAlign: "left"   },
  { key: "page_path",    label: "경로",        defaultAlign: "left"   },
  { key: "admin_access", label: "admin 접근",  defaultAlign: "center" },
  { key: "user_access",  label: "user 접근",   defaultAlign: "center" },
];

// ── 헬퍼 ───────────────────────────────────────────────────────

// YYYY.MM.DD 형식 변환
function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, "0")}.${String(
    d.getDate()
  ).padStart(2, "0")}`;
}

// 역할 문자열을 Badge variant로 변환
function roleToBadgeVariant(role: string): BadgeVariant {
  if (role === "master") return "master";
  if (role === "admin")  return "admin";
  return "user";
}

// 토글 스위치 (권한 설정 탭 전용)
function ToggleSwitch({
  checked,
  onChange,
  disabled,
}: {
  checked: boolean;
  onChange: () => void;
  disabled: boolean;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={onChange}
      disabled={disabled}
      className={[
        "relative inline-flex h-6 w-11 cursor-pointer items-center rounded-full transition-colors focus:outline-none disabled:cursor-not-allowed disabled:opacity-50",
        checked ? "bg-blue-600" : "bg-gray-200",
      ].join(" ")}
    >
      <span
        className={[
          "inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform",
          checked ? "translate-x-6" : "translate-x-1",
        ].join(" ")}
      />
    </button>
  );
}

// ── 메인 컴포넌트 ──────────────────────────────────────────────

// 관리자 페이지 — 클라이언트 컴포넌트 (master 전용)
export default function AdminPage() {
  // 현재 활성 탭
  const [activeTab, setActiveTab] = useState<TabKey>("users");

  // ── 계정 목록 상태 ─────────────────────────────────────────
  const [users, setUsers]               = useState<UserRow[]>([]);
  const [usersLoading, setUsersLoading] = useState<boolean>(true);
  const [pendingUserIds, setPendingUserIds] = useState<Set<number>>(new Set());

  // ── 권한 설정 상태 ─────────────────────────────────────────
  const [permissions, setPermissions]   = useState<PermissionRow[]>([]);
  const [permsLoading, setPermsLoading] = useState<boolean>(false);
  // 권한 탭 최초 진입 여부 (중복 조회 방지)
  const [permsLoaded, setPermsLoaded]   = useState<boolean>(false);
  const [pendingPermIds, setPendingPermIds] = useState<Set<number>>(new Set());

  // ── 모달 상태 ─────────────────────────────────────────────
  // null이면 모달 미표시, 객체이면 표시
  const [modal, setModal]               = useState<ModalState | null>(null);
  const [modalPending, setModalPending] = useState<boolean>(false);

  // 모달 열기/닫기 헬퍼
  const showModal  = (state: ModalState) => setModal(state);
  const closeModal = () => { setModal(null); setModalPending(false); };

  // ── 계정 API ──────────────────────────────────────────────

  const fetchUsers = useCallback(async (): Promise<void> => {
    try {
      const res = await fetch("/api/admin/users");
      if (res.ok) {
        const data: { users: UserRow[] } = await res.json();
        setUsers(data.users);
      }
    } finally {
      setUsersLoading(false);
    }
  }, []);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  // pending 상태 관리 헬퍼
  const setPendingUser = (id: number, active: boolean): void => {
    setPendingUserIds((prev) => {
      const next = new Set(prev);
      active ? next.add(id) : next.delete(id);
      return next;
    });
  };

  // 역할 변경
  const handleRoleChange = async (userId: number, role: string): Promise<void> => {
    setPendingUser(userId, true);
    try {
      await fetch(`/api/admin/users/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role }),
      });
      // 낙관적 UI 업데이트
      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, role } : u))
      );
    } finally {
      setPendingUser(userId, false);
    }
  };

  // 활성화/비활성화 토글
  const handleToggleActive = async (
    userId: number,
    isActive: boolean
  ): Promise<void> => {
    setPendingUser(userId, true);
    try {
      await fetch(`/api/admin/users/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive }),
      });
      setUsers((prev) =>
        prev.map((u) =>
          u.id === userId ? { ...u, is_active: isActive } : u
        )
      );
    } finally {
      setPendingUser(userId, false);
    }
  };

  // 계정 삭제 — Modal로 확인 후 실행
  const handleDeleteClick = (userId: number, userName: string): void => {
    showModal({
      title: "계정 삭제",
      message: `"${userName}" 계정을 삭제하시겠습니까?\n이 작업은 되돌릴 수 없습니다.`,
      onConfirm: async () => {
        setModalPending(true);
        try {
          const res = await fetch(`/api/admin/users/${userId}`, {
            method: "DELETE",
          });
          if (res.ok) {
            setUsers((prev) => prev.filter((u) => u.id !== userId));
          }
        } finally {
          closeModal();
        }
      },
    });
  };

  // ── 권한 API ──────────────────────────────────────────────

  const fetchPermissions = useCallback(async (): Promise<void> => {
    setPermsLoading(true);
    try {
      const res = await fetch("/api/admin/permissions");
      if (res.ok) {
        const data: { permissions: PermissionRow[] } = await res.json();
        setPermissions(data.permissions);
      }
    } finally {
      setPermsLoading(false);
      setPermsLoaded(true);
    }
  }, []);

  // 권한 탭 최초 진입 시 로드
  useEffect(() => {
    if (activeTab === "permissions" && !permsLoaded) {
      fetchPermissions();
    }
  }, [activeTab, permsLoaded, fetchPermissions]);

  // 권한 토글
  const handlePermToggle = async (
    permId: number,
    field: "adminAccess" | "userAccess",
    value: boolean
  ): Promise<void> => {
    setPendingPermIds((prev) => new Set(prev).add(permId));
    try {
      await fetch("/api/admin/permissions", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: permId, [field]: value }),
      });
      setPermissions((prev) =>
        prev.map((p) => {
          if (p.id !== permId) return p;
          return {
            ...p,
            admin_access:
              field === "adminAccess" ? value : p.admin_access,
            user_access:
              field === "userAccess" ? value : p.user_access,
          };
        })
      );
    } finally {
      setPendingPermIds((prev) => {
        const next = new Set(prev);
        next.delete(permId);
        return next;
      });
    }
  };

  // ── 셀 렌더링 함수 ────────────────────────────────────────

  // 계정 목록 테이블 셀 렌더링 — columnKey에 따라 각 셀 JSX 반환
  const renderUserCell = (
    key: string,
    user: UserRow,
    _index: number
  ): ReactNode => {
    // 현재 행의 처리 중 여부
    const isPending = pendingUserIds.has(user.id);

    switch (key) {
      case "name":
        // 이름 + 모바일에서 역할 배지 인라인 표시
        // inline-flex: td의 text-align(left/center/right)이 이 컨테이너 위치를 제어
        // flex(block 레벨)는 td의 text-align에 반응하지 않아 정렬 변경이 시각적으로 미반영됨
        return (
          <div className="inline-flex items-center gap-2 font-medium text-gray-900">
            {user.name}
            {/* 모바일: 역할 배지를 이름 옆에 (태블릿 이상은 역할 컬럼에서 표시) */}
            <span className="md:hidden">
              <Badge variant={roleToBadgeVariant(user.role)}>
                {user.role}
              </Badge>
            </span>
          </div>
        );

      case "email":
        return (
          <span className="block max-w-[160px] truncate text-gray-500 lg:max-w-none">
            {user.email}
          </span>
        );

      case "role":
        // 역할 드롭다운 (태블릿 이상에서만 표시 — column className으로 제어)
        return (
          <select
            value={user.role}
            onChange={(e) => handleRoleChange(user.id, e.target.value)}
            disabled={isPending}
            className={[
              "rounded-md border px-2 py-1 text-xs font-medium transition-colors",
              user.role === "master"
                ? "border-purple-200 bg-purple-50 text-purple-700"
                : user.role === "admin"
                  ? "border-blue-100 bg-blue-50 text-blue-700"
                  : "border-gray-200 bg-gray-50 text-gray-500",
              isPending
                ? "cursor-not-allowed opacity-50"
                : "cursor-pointer",
            ].join(" ")}
          >
            {ROLES.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
        );

      case "created_at":
        return (
          <span className="text-gray-400">{formatDate(user.created_at)}</span>
        );

      case "is_active":
        // 활성/비활성 토글 버튼
        return (
          <button
            type="button"
            onClick={() => handleToggleActive(user.id, !user.is_active)}
            disabled={isPending}
            title={user.is_active ? "클릭하면 비활성화" : "클릭하면 활성화"}
            className={[
              "inline-flex min-h-[32px] items-center rounded-full px-3 py-1 text-xs font-medium transition-colors",
              user.is_active
                ? "bg-green-50 text-green-700 hover:bg-green-100"
                : "bg-red-50 text-red-600 hover:bg-red-100",
              isPending ? "cursor-not-allowed opacity-50" : "cursor-pointer",
            ].join(" ")}
          >
            {user.is_active ? "활성" : "비활성"}
          </button>
        );

      case "delete":
        return (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleDeleteClick(user.id, user.name)}
            disabled={isPending}
            className="text-red-500 hover:bg-red-50 hover:text-red-600"
          >
            삭제
          </Button>
        );

      default:
        return null;
    }
  };

  // 권한 설정 테이블 셀 렌더링
  const renderPermCell = (
    key: string,
    perm: PermissionRow,
    _index: number
  ): ReactNode => {
    // 현재 행의 처리 중 여부
    const isPending = pendingPermIds.has(perm.id);

    switch (key) {
      case "page_name":
        return (
          <span className="font-medium text-gray-900">{perm.page_name}</span>
        );

      case "page_path":
        return (
          <code className="rounded bg-gray-100 px-1.5 py-0.5 text-xs text-gray-500">
            {perm.page_path}
          </code>
        );

      case "admin_access":
        return (
          <ToggleSwitch
            checked={perm.admin_access}
            onChange={() =>
              handlePermToggle(perm.id, "adminAccess", !perm.admin_access)
            }
            disabled={isPending}
          />
        );

      case "user_access":
        return (
          <ToggleSwitch
            checked={perm.user_access}
            onChange={() =>
              handlePermToggle(perm.id, "userAccess", !perm.user_access)
            }
            disabled={isPending}
          />
        );

      default:
        return null;
    }
  };

  // ── 렌더링 ────────────────────────────────────────────────

  return (
    <div className="min-h-full bg-gray-50">
      <div className="mx-auto max-w-5xl px-4 py-6 md:py-8">

        {/* 페이지 제목 */}
        <h1 className="mb-6 text-xl font-bold text-gray-800 md:text-2xl">
          계정관리
        </h1>

        {/* 탭 컴포넌트 */}
        <Tabs
          tabs={TABS}
          activeTab={activeTab}
          onChange={(key) => setActiveTab(key as TabKey)}
          className="mb-6"
        />

        {/* ── 탭: 계정 목록 ──────────────────────────────────── */}
        {activeTab === "users" && (
          <AlignableTable
            tableId="admin-users"
            columns={USER_COLUMNS}
            data={users}
            renderCell={renderUserCell}
            getRowKey={(user) => user.id}
            loading={usersLoading}
            emptyMessage="등록된 계정이 없습니다."
          />
        )}

        {/* ── 탭: 권한 설정 ──────────────────────────────────── */}
        {activeTab === "permissions" && (
          <div>
            {/* master 안내 배너 */}
            <div className="mb-4 rounded-lg border border-blue-100 bg-blue-50 px-4 py-3 text-xs text-blue-700">
              <strong>master</strong>는 모든 페이지에 항상 접근 가능합니다.
              아래 설정은 <strong>admin</strong>과 <strong>user</strong>의
              접근 여부를 제어합니다.
            </div>

            <AlignableTable
              tableId="admin-permissions"
              columns={PERM_COLUMNS}
              data={permissions}
              renderCell={renderPermCell}
              getRowKey={(perm) => perm.id}
              loading={permsLoading}
              emptyMessage="등록된 페이지 권한이 없습니다."
            />
          </div>
        )}

      </div>

      {/* 삭제 확인 모달 */}
      {modal && (
        <Modal
          isOpen
          title={modal.title}
          message={modal.message}
          confirmText="삭제"
          confirmVariant="danger"
          onConfirm={modal.onConfirm}
          onCancel={closeModal}
          isPending={modalPending}
        />
      )}
    </div>
  );
}
