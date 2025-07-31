import { useEffect, useRef } from "react";

export default function LiveKitVideo({ videoTrack, isLocal }) {
  const videoRef = useRef(null);

  useEffect(() => {
    if (videoTrack && videoRef.current) {
      videoTrack.attach(videoRef.current);

      return () => {
        videoTrack.detach(videoRef.current);
      };
    }
  }, [videoTrack]);

  return (
    <video
      ref={videoRef}
      autoPlay
      playsInline
      muted={isLocal}
      style={{ borderRadius: "8px", width: "240px", height: "180px" }}
    />
  );
}