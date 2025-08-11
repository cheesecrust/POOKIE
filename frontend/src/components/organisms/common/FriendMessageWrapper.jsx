// FriendMessageWrapper.jsx
import { useState, useEffect } from "react";
import PookieButton from "../../atoms/button/PookieButton";
import FriendMessageModal from "./FriendMessageModal";

const FriendMessageWrapper = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const close = () => setIsModalOpen(false);

  const handleToggleModal = () => setIsModalOpen(prev => !prev);

  // ESC로 닫기 (Wrapper 차원)
  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && close();
    if (isModalOpen) window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isModalOpen]);

  return (
    <>
      {/* Pookie 버튼 */}
      <div className="fixed bottom-6 right-6 z-50">
        <PookieButton onClick={handleToggleModal} />
      </div>

      {/* 모달 */}
      {isModalOpen && (
        <div
          className="fixed inset-0 z-40 flex items-center justify-center"
          onClick={close} 
        >
          <div className="absolute inset-0 bg-black/30" aria-hidden="true" />
          <div
            className="relative" 
            onClick={(e) => e.stopPropagation()}
          >
            <FriendMessageModal onClose={close} />
          </div>
        </div>
      )}
    </>
  );
};

export default FriendMessageWrapper;
