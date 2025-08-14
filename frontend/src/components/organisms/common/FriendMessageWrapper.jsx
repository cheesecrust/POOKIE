// FriendMessageWrapper.jsx
import { useState, useEffect } from "react";
import PookieButton from "../../atoms/button/PookieButton";
import FriendMessageModal from "./FriendMessageModal";
import useHomeStore from "../../../store/useHomeStore";

const FriendMessageWrapper = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const close = () => setIsModalOpen(false);
  const handleToggleModal = () => setIsModalOpen(prev => !prev);

  const notification = useHomeStore((s) => s.notification) ?? 0;

  // ESC로 닫기
  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && close();
    if (isModalOpen) window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isModalOpen]);

  const hasUnread = Number(notification) > 0;

  return (
    <>
      {/* Pookie 버튼 (깜빡 효과만) */}
      <div className="fixed bottom-6 right-6 z-50">
        <div
          className={
            hasUnread
              ? "animate-pulse filter drop-shadow-[0_0_10px_rgba(239,68,68,0.9)]"
              : ""
          }
          aria-live="polite"
          aria-label={hasUnread ? "안 읽은 쪽지 있음" : "쪽지"}
        >
          <PookieButton onClick={handleToggleModal} />
        </div>
      </div>

      {/* 모달 */}
      {isModalOpen && (
        <div
          className="fixed inset-0 z-40 flex items-center justify-center"
          onClick={close}
        >
          <div className="absolute inset-0 bg-black/30" aria-hidden="true" />
          <div className="relative" onClick={(e) => e.stopPropagation()}>
            <FriendMessageModal onClose={close} />
          </div>
        </div>
      )}
    </>
  );
};

export default FriendMessageWrapper;
