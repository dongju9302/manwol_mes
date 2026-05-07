import { ImageResponse } from "next/og";
import { readFileSync } from "fs";
import { join } from "path";

// 파비콘 캔버스: 정사각형 (브라우저 탭은 항상 정사각형 영역에 표시)
export const size = { width: 32, height: 32 };
export const contentType = "image/png";

// 브라우저 탭 파비콘 생성 — logo.png를 비율 유지(objectFit: contain)로 중앙 배치
export default function Icon() {
  // public 폴더의 PNG를 base64로 읽어 <img>에 삽입
  // (서버 사이드에서 실행되므로 readFileSync 사용 가능)
  const logoBuffer = readFileSync(join(process.cwd(), "public", "logo.png"));
  const logoSrc = `data:image/png;base64,${logoBuffer.toString("base64")}`;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          // 배경 없음: 브라우저 탭 배경이 그대로 비침
        }}
      >
        <img
          src={logoSrc}
          style={{
            width: "100%",
            height: "100%",
            // contain: 비율 유지 + 전체 로고 표시, 크기는 최대한
            objectFit: "contain",
          }}
        />
      </div>
    ),
    { ...size }
  );
}
