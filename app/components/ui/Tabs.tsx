"use client";

// 공통 탭 전환 컴포넌트
// 탭 스트립만 렌더링, 콘텐츠 영역은 소비자(consumer)가 직접 렌더링
// 사용 예:
//   <Tabs tabs={[{ key: "a", label: "A탭" }]} activeTab={tab} onChange={setTab} />
//   {tab === "a" && <div>A 내용</div>}

export interface Tab {
  // 탭 고유 키
  key: string;
  // 탭 레이블
  label: string;
}

interface TabsProps {
  // 탭 목록
  tabs: Tab[];
  // 현재 활성 탭 키
  activeTab: string;
  // 탭 변경 콜백
  onChange: (key: string) => void;
  className?: string;
}

export default function Tabs({
  tabs,
  activeTab,
  onChange,
  className = "",
}: TabsProps) {
  return (
    // 탭 스트립 컨테이너: 연한 회색 배경 위 흰색 활성 탭
    <div
      className={[
        "flex gap-1 rounded-lg border border-gray-200 bg-gray-50 p-1",
        className,
      ].join(" ")}
    >
      {tabs.map((tab) => (
        <button
          key={tab.key}
          type="button"
          onClick={() => onChange(tab.key)}
          className={[
            "flex-1 cursor-pointer rounded-md py-3 text-sm font-medium transition-colors min-h-[44px] md:py-2 md:min-h-[36px]",
            // 활성 탭: 흰색 배경 + 파란 텍스트 + 그림자
            activeTab === tab.key
              ? "bg-white text-blue-600 shadow-sm"
              : "text-gray-500 hover:text-gray-700",
          ].join(" ")}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
