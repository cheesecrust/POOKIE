// src/components/atoms/message/MessageCard.jsx
import { useState } from "react";
import axiosInstance from "../../../lib/axiosInstance";
import MessageDetailCard from "./MessageDetailCard";

const MessageCard = ({
  messageType,          // 'received' | 'sent'
  nickname,
  date,
  messageContent,
  requestId,
  status,
  onDelete,
}) => {
  const [open, setOpen] = useState(false);
  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(false);

  const isReceived = messageType === "received";

  const openDetail = async () => {
    if (!isReceived || !requestId) return;
    setLoading(true);
    try {
      const res = await axiosInstance.get(`/letter/${requestId}/detail`);
      console.log("쪽지 상세 조회:", res.data.data);
      setDetail(res.data.data);
      
      setOpen(true);
    } catch (e) {
      console.log("쪽지 상세 조회 실패:", e);
    }
  };

  return (
    <>
      <div
        className={`relative w-full p-4 rounded-2xl bg-white h-[95px] select-none ${
          isReceived ? "cursor-pointer" : "cursor-default"
        }`}
        onDoubleClick={isReceived ? openDetail : undefined}     
      >
        <div className="flex justify-between items-center mb-2 text-sm text-gray-600">
          <span className="truncate max-w-[60%]">
            {messageType === "sent"
              ? `받은사람 : ${nickname}`
              : `보낸 사람 : ${nickname}`}
          </span>
          <span className="shrink-0">{date}</span>
        </div>

        <div className="text-base text-gray-800 mb-6 truncate" title={messageContent}>
          {messageContent}
        </div>

        <div className="absolute bottom-2 right-2 flex gap-2 text-xs">
          {messageType === "sent" && (
            <>
              <span className="text-gray-500 italic">
                {status === "1" ? "읽지 않음" : "읽음"}
              </span>
              <button
                onClick={() => onDelete?.(requestId, messageType)}
                className="text-gray-400 hover:underline"
              >
                삭제
              </button>
            </>
          )}

          {isReceived && (
            <>
              {/* <button onClick={onReport} className="text-red-500 hover:underline">
                신고
              </button> */}
              <button
                onClick={() => onDelete?.(requestId, messageType)}
                className="text-gray-400 hover:underline"
              >
                삭제
              </button>
            </>
          )}
        </div>
      </div>

      {/* 상세 모달 */}
      <MessageDetailCard isOpen={open} detail={detail} onClose={() => setOpen(false)} />
    </>
  );
};

export default MessageCard;
