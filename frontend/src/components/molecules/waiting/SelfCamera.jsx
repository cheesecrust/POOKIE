// src/components/molecules/waiting/SelfCamera.jsx
import { useEffect, useRef } from "react";

const SelfCamera = () => {
  const videoRef = useRef(null);

  useEffect(() => {
    const getCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: false, // 필요 시 true
        });

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (err) {
        console.error("캠 접근 실패:", err);
      }
    };

    getCamera();
  }, []);

  return (
    <>
      <p> 외모 췍크 ↗️ </p>
      <div className="w-80 h-52 border-2 m-4 border-pink-400 rounded-lg overflow-hidden">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="w-full h-full object-cover transform -scale-x-100"
          // transform -scale-x-100: 좌우 반전 (거울처럼)
        />
      </div>
    </>
  );
};

export default SelfCamera;
