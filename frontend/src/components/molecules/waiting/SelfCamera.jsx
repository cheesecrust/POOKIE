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
      <p> ㅇ.ㅇ 외모 check</p>
      <div className="w-64 h-48 border-2 m-2 border-pink-400 bg-black rounded-lg overflow-hidden">
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
