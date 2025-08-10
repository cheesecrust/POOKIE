// src/components/audio/BGMProvider.jsx

import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import mainTheme from "../../assets/audio/themesong1.mp3";
import gameTheme from "../../assets/audio/themesong2.mp3";
import roomTheme from "../../assets/audio/themesong3.mp3"
import useAudioStore from "../../store/useAudioStore";

const BGMProvider = () => {
  const location = useLocation();
  const { audio, currentSrc, setAudio, setCurrentSrc, volumePct } = useAudioStore();

  useEffect(() => {
    let nextSrc = null;

    if (location.pathname === "/" || location.pathname === "/home") {
      nextSrc = mainTheme;
    } else if (
      location.pathname.startsWith("/waiting") ||
      location.pathname.startsWith("/game")
    ) {
      nextSrc = gameTheme;
    } else if (location.pathname.startsWith("/myroom")) {
      nextSrc = roomTheme;
    }

    // 같은 음악이면 변경 X
    if (currentSrc === nextSrc) return;

    // 새 오디오 객체 생성
    const newAudio = new Audio(nextSrc);
    newAudio.loop = true;
    newAudio.volume = (volumePct ?? 50) / 100;

    newAudio
      .play()
      .then(() => {
        // 이전 음악 정지
        if (audio) {
            audio.pause();
            audio.currentTime = 0;
        }
        setAudio(newAudio);
        setCurrentSrc(nextSrc);
      })
      .catch((err) => {
        console.warn("음악 재생 실패:", err);
      });
  }, [location.pathname, audio, currentSrc, setAudio, setCurrentSrc]);

  useEffect(() => {
    if (audio) {
      audio.volume = (volumePct ?? 50) / 100
    }
  }, [audio, volumePct])

  return null;
};

export default BGMProvider;