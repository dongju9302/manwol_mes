"use client";

// 공통 확인/취소 모달 컴포넌트
// window.confirm() 대체용: 비동기 UX + 커스텀 스타일링
// 오버레이 영역 클릭 시 onCancel 호출

import Button from "./Button";

interface ModalProps {
  // 모달 표시 여부
  isOpen: boolean;
  // 모달 제목
  title: string;
  // 모달 설명 메시지
  message: string;
  // 확인 버튼 텍스트 (기본: "확인")
  confirmText?: string;
  // 취소 버튼 텍스트 (기본: "취소")
  cancelText?: string;
  // 확인 버튼 variant (danger: 삭제 등 위험 동작 강조)
  confirmVariant?: "primary" | "danger";
  // 확인 버튼 클릭 시 실행
  onConfirm: () => void;
  // 취소 버튼 클릭 또는 오버레이 클릭 시 실행
  onCancel: () => void;
  // 처리 중 버튼 비활성화
  isPending?: boolean;
}

export default function Modal({
  isOpen,
  title,
  message,
  confirmText = "확인",
  cancelText = "취소",
  confirmVariant = "primary",
  onConfirm,
  onCancel,
  isPending = false,
}: ModalProps) {
  // isOpen이 false면 아무것도 렌더링하지 않음
  if (!isOpen) return null;

  return (
    // 오버레이: 화면 전체를 덮는 반투명 검정 레이어
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
      onClick={(e) => {
        // 오버레이 영역(자기 자신) 클릭 시만 닫기 (다이얼로그 클릭은 통과)
        if (e.target === e.currentTarget) onCancel();
      }}
    >
      {/* 다이얼로그 본체 */}
      <div className="w-full max-w-sm rounded-xl border border-gray-200 bg-white p-6 shadow-lg">
        {/* 제목 */}
        <h3 className="mb-2 text-base font-semibold text-gray-900">{title}</h3>

        {/* 설명 */}
        <p className="mb-6 text-sm leading-relaxed text-gray-500">{message}</p>

        {/* 버튼 영역: 우측 정렬 */}
        <div className="flex justify-end gap-2">
          {/* 취소 버튼 */}
          <Button
            variant="secondary"
            size="md"
            onClick={onCancel}
            disabled={isPending}
          >
            {cancelText}
          </Button>

          {/* 확인 버튼 */}
          <Button
            variant={confirmVariant}
            size="md"
            onClick={onConfirm}
            disabled={isPending}
          >
            {isPending ? "처리 중..." : confirmText}
          </Button>
        </div>
      </div>
    </div>
  );
}
