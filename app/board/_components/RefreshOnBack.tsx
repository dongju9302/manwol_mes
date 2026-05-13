"use client";

import { useEffect } from "react";

export default function RefreshOnBack() {
  useEffect(() => {
    console.log("[DEBUG-RefreshOnBack] 마운트 시각:", new Date().toISOString());

    const handlePageShow = (event: PageTransitionEvent): void => {
      console.log("[DEBUG-RefreshOnBack] pageshow 이벤트 발생", {
        persisted: event.persisted,
        type: event.type,
      });

      if (event.persisted) {
        console.log("[DEBUG-RefreshOnBack] bfcache 감지 → reload 실행");
        window.location.reload();
      } else {
        console.log("[DEBUG-RefreshOnBack] persisted=false, reload 안 함");
      }
    };

    const handlePageHide = (event: PageTransitionEvent): void => {
      console.log("[DEBUG-RefreshOnBack] pagehide", {
        persisted: event.persisted,
      });
    };

    window.addEventListener("pageshow", handlePageShow);
    window.addEventListener("pagehide", handlePageHide);

    return () => {
      window.removeEventListener("pageshow", handlePageShow);
      window.removeEventListener("pagehide", handlePageHide);
    };
  }, []);

  return null;
}
