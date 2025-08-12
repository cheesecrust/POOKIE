// src/components/atoms/modal/MyRoomModal.jsx
import { useEffect } from "react";

const MyRoomModal = ({ isOpen, title = "알림", message, onClose }) => {
    // ESC 키로 닫기
    useEffect(() => {
      if (!isOpen) return;
      const handleKeyDown = (e) => {
        if (e.key === "Escape") onClose?.();
      };
      window.addEventListener("keydown", handleKeyDown);
      return () => window.removeEventListener("keydown", handleKeyDown);
    }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    // 부모 카드 기준으로 꽉 채우되, 이벤트는 통과시킴
    <div className="absolute inset-0 z-20 flex items-center justify-center">
      {/* 실제 모달 박스만 이벤트 받기 */}
      <div
        className="w-[320px] rounded-xl bg-white shadow-xl border-2 border-black p-5"
        role="dialog"
        aria-modal="true"
      >
        <h3 className="text-xl font-bold mb-2">{title}</h3>
        <p className="text-sm text-gray-700 whitespace-pre-line">{message}</p>
        <button
          onClick={onClose}
          className="mt-4 w-full rounded-lg border-2 border-black px-4 py-2 bg-white hover:bg-gray-100 "
        >
          확인
        </button>
      </div>
    </div>
  );
};

export default MyRoomModal;
