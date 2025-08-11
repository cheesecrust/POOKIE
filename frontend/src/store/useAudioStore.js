// src/store/useAudioStore.js

import { create } from "zustand";
import { persist } from "zustand/middleware";

const useAudioStore = create(
    persist(
      (set, get) => ({
        audio: null,
        currentSrc: null,
        started: false,

        // 기본 볼륨 상태
        volumePct: 50,

        // setters
        setAudio: (audio) => set({ audio }),
        setCurrentSrc: (src) => set({ currentSrc: src }),
        setStarted: (bool) => set({ started: bool }),

        // 볼륨 setter
        setVolumePct: (pct) => {
          const v = Math.max(0, Math.min(100, Number(pct) || 0));
          const { audio } = get();
          if (audio) {
            audio.volume = v / 100;
            // v === 0 이어도 재생 유지지
          }
          set({ volumePct: v });
        },

        // 아이콘 토글
        toggleMuteIcon: () => {
          const { volumePct, setVolumePct, audio } = get()
          if (volumePct === 0) {
            setVolumePct(10);
            if (audio && audio.paused) audio.play().catch(() => {});
          } else {
            setVolumePct(0);
          }
        },
      }),
      {
        name: "audio-storage", // localStorage 키
        partialize: (state) => ({
          currentSrc: state.currentSrc,
          started: state.started,
        }),
      }
    )
  );
  
export default useAudioStore;