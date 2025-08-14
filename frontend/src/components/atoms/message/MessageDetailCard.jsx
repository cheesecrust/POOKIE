// src/components/atoms/message/MessageCard.jsx
// 사용 예시:
// <MessageCard messageType="received" nickname="다예" date="2023-08-05 12:00:00"
//   messageContent="안녕하세용" requestId={1} isRead={0}
//   onDelete={(id,type)=>{}} onReport={()=>{}} />

import { useEffect } from "react";

const MessageDetailCard = ({ isOpen, detail, onClose }) => {
  // ESC 닫기
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e) => e.key === "Escape" && onClose?.();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/20"
      role="dialog"
      aria-modal="true"
      onClick={onClose} 
    >
      <div
        className="w-[360px] max-h-[400px] rounded-2xl bg-white border-2 border-black shadow-2xl p-5"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-xl font-bold mb-3">쪽지 상세</h3>

          <div className="space-y-2 text-sm text-gray-800">
            <div className="flex justify-between">
              <span className="font-semibold">보낸 사람</span>
              <span>{detail.senderNickname}</span>
            </div>
            <div>
              <span className="font-semibold">내용</span>
              <div className="mt-1 rounded-lg border p-3 whitespace-pre-wrap break-words">
                {detail.message}
              </div>
            </div>
          </div>

        <button
          onClick={onClose}
          className="mt-5 w-full rounded-lg border-2 border-black px-4 py-2 bg-white hover:bg-gray-100"
        >
          확인
        </button>
      </div>
    </div>
  );
};

export default MessageDetailCard;