// src/utils/useClickSfx.js
import { useEffect, useRef } from "react";
import useSound from "./useSound";

/**
 * @param {Object} options
 * @param {string[]} options.excludeSelectors 제외할 셀렉터 목록 (예: ['.no-sound', '#skipButton'])
 * @param {number} options.cooldown 클릭 후 재생 대기 시간(ms) → 더블클릭 방지
 */
export default function useClickSfx({
  excludeSelectors = [],
  cooldown = 200,
} = {}) {
  const { playSound } = useSound();
  const lastClickTime = useRef(0);

  useEffect(() => {
    const handleClick = (e) => {
      const now = Date.now();

      // 더블클릭 방지
      if (now - lastClickTime.current < cooldown) return;
      lastClickTime.current = now;

      const targetEl = e.target.closest("button, [role='button'], a");
      if (!targetEl) return;

      // 예외 버튼 필터
      const isExcluded = excludeSelectors.some((selector) =>
        targetEl.matches(selector)
      );
      if (isExcluded) return;

      // 클릭 사운드 재생
      playSound("click");
    };

    document.addEventListener("click", handleClick, true); // capture 단계
    return () => {
      document.removeEventListener("click", handleClick, true);
    };
  }, [playSound, excludeSelectors, cooldown]);
}
