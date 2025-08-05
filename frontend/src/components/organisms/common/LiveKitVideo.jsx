// src/components/organisms/common/LiveKitVideo.jsx
import { useEffect, useRef } from "react";

export default function LiveKitVideo({
  videoTrack,
  isLocal,
  nickname,
  isRef = false, // refIdx 여부부
  containerClassName = "relative w-90 h-60 shadow-lg overflow-hidden",
  nicknameClassName = "absolute bottom-2 left-2 text-white text-2xl px-2 py-1 z-10",
}) {
  const videoRef = useRef(null);

  useEffect(() => {
    if (videoTrack && videoRef.current) {
      videoTrack.attach(videoRef.current);

      return () => {
        videoTrack.detach(videoRef.current);
      };
    }
  }, [videoTrack]);

  // Rep 시, 테두리 효과
  const borderClass = isRef ? "border-2 border-red-500" : "";

  return (
    <div className={`${containerClassName} ${borderClass}`}>
      {/* 캠 비디오 */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted={isLocal}
        className="flex-1 w-full h-full object-cover border-1 border-black"
        />
        {/* 닉네임 표시 (하단 텍스트) */}
        {nickname && (
          <p className={nicknameClassName}>
            {nickname}
          </p>
        )}
    </div>
  );
}