import { useState, useEffect } from "react";
import axiosInstance from "../../../lib/axiosInstance";
import RightButton from "../button/RightButton";

const SendMessageModal = ({ onClose, friendId }) => {
  const [message, setMessage] = useState("");

  // ESC 키로 모달 닫기
  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [onClose]);

  const handleSend = async () => {
    if (!message.trim()) return;
    try {
      await axiosInstance.post("/letter", {
        receiverId: friendId,
        message: message,
      });
      onClose();
    } catch (err) {
      console.log("쪽지 보내기 실패:", err);
    }
  };

  return (
    <div
      className="fixed inset-0 flex items-center justify-center bg-opacity-30 z-50"
      onClick={onClose} // 바깥 클릭 시 닫기
    >
      <div
        className="relative bg-[#F8DFF0] rounded-3xl w-[420px] h-[320px] shadow-lg 
        flex flex-col items-center justify-start p-4"
        onClick={(e) => e.stopPropagation()} // 내부 클릭 시 닫기 방지
      >
        <h2 className="text-xl font-bold mt-2">쪽지 보내기</h2>
        <div className="w-[90%] h-[200px] bg-white rounded-2xl shadow-md mt-3 p-2">
          <textarea
            className="w-full h-full outline-none resize-none text-left text-sm bg-white
                       overflow-y-auto break-words whitespace-pre-wrap"
            placeholder="메세지를 입력하세요"
            value={message}
            maxLength={350}
            onChange={(e) => setMessage(e.target.value)}
          />
        </div>
        <div className="mt-3">
          <RightButton size="sm" onClick={handleSend}>
            전송
          </RightButton>
        </div>
      </div>
    </div>
  );
};

export default SendMessageModal;
