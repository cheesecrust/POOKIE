// src/store/useAudioStore.js

import { create } from "zustand";
import { persist } from "zustand/middleware";

const useAudioStore = create(
    persist(
      (set) => ({
        audio: null,
        currentSrc: null,
        started: false,
        setAudio: (audio) => set({ audio }),
        setCurrentSrc: (src) => set({ currentSrc: src }),
        setStarted: (bool) => set({ started: bool }),
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