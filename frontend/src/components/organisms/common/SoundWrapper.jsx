// src/components/organisms/common/SoundWrapper.jsx
import { useMemo, useRef, useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import useAudioStore from "../../../store/useAudioStore";
import soundOnImg from "../../../assets/icon/sound_on.png";
import soundOffImg from "../../../assets/icon/sound_off.png";

const SoundWrapper = ({
  positionClass = "fixed top-8 right-8",
  className = "",
  showOnRoutes = ["/", "/login", "/home"],
}) => {
  const location = useLocation();
  const { volumePct, setVolumePct, toggleMuteIcon } = useAudioStore();
  const isMuted = volumePct === 0;

  const [open, setOpen] = useState(false);
  const boxRef = useRef(null);

  const visible = useMemo(() => {
    return showOnRoutes.some((p) =>
      p.endsWith("*") ? location.pathname.startsWith(p.slice(0, -1)) : location.pathname === p
    );
  }, [location.pathname, showOnRoutes]);

  // 바깥 클릭 닫기
  useEffect(() => {
    const onDown = (e) => {
      if (!boxRef.current) return;
      if (!boxRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, []);

  if (!visible) return null;

  return (
    <div
      ref={boxRef}
      className={`no-sound ${positionClass} z-[9999] select-none pointer-events-auto ${className}`}
    >
      {/* 상단 아이콘 (투명 배경) */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-controls="sound-volume"
        title={isMuted ? "켜기" : "음소거"}
        className="p-1 rounded-xl hover:scale-105 transition-transform"
      >
        <img
          src={isMuted ? soundOffImg : soundOnImg}
          alt={isMuted ? "sound off" : "sound on"}
          className="w-12 h-12 object-contain"
        />
      </button>

      {/* 같은 컨테이너 안에서 '아래로' 펼쳐지는 영역 */}
      <div
        id="sound-volume"
        className={[
          "w-full overflow-hidden origin-top",
          "transition-all duration-200 ease-out",
          open ? "max-h-40 opacity-100 translate-y-0" : "max-h-0 opacity-0 -translate-y-1",
        ].join(" ")}
      >
        {/* 볼륨 바 (세로) */}
        <div className="mt-2 flex justify-center">
          <div className="relative h-36 w-8 flex items-center justify-center">
            <input
              type="range"
              min="0"
              max="100"
              value={volumePct}
              onChange={(e) => setVolumePct(Number(e.target.value))}
              aria-label="BGM volume"
              style={{ '--p': `${volumePct}%` }}
              className={[
                "absolute",
                "w-36 h-6 -rotate-90 -scale-x-100",
                "cursor-pointer range-plain",
              ].join(" ")}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default SoundWrapper;