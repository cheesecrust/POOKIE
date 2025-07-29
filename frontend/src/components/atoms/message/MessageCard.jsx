// 경로: src/components/atoms/message/MessageCard.jsx
// 사용 예시
//   <MessageCard messageType="received" nickname="다예" date="2023-08-05 12:00:00" message="안녕하세용" isRead={false} onDelete={() => {}} onReport={() => {}} />

// 필요 기능: 쪽지 삭제, 쪽지 신고

const MessageCard = ({messageType, nickname,date, messageContent,isRead,onDelete,onReport}) => {
    return (
        <div className="relative w-full p-4 rounded-2xl bg-white  h-[95px]">
          <div className="flex justify-between items-center mb-2 text-sm text-gray-600">
            <span>{messageType === 'sent' ? `받은사람 : ${nickname}` : `보낸 사람 : ${nickname}`} </span>
            <span>{date}</span>
          </div>
    

          <div className="text-base text-gray-800 mb-6">{messageContent}</div>
    
          <div className="absolute bottom-2 right-2 flex gap-2 text-xs">
            {messageType === 'sent' && (
              <span className="text-gray-500 italic">{isRead ? '읽음' : ''}</span>
            )}
    
            {messageType === 'received' && (
              <button onClick={onReport} className="text-red-500 hover:underline">신고</button>
            )}
    
            <button onClick={onDelete} className="text-gray-400 hover:underline">삭제</button>
          </div>
        </div>
      );
    };
    

export default MessageCard;