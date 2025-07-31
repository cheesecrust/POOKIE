// 경로: src/components/atoms/message/FriendRequestCard.jsx
import RightButton from "../button/RightButton"

const FriendRequestCard = ({ nickname, date, messageContent, requestId, onAccept, onReject }) => {

    const handleAccept = async (requestId) => {
        try {
            await onAccept(requestId)
        } catch (err) {
            console.log("친구 수락 실패:",err)
        }
    }
    const handleReject = async (requestId) => {
        try {
            await onReject(requestId)
        } catch (err) {
            console.log("친구 거절 실패:",err)
        }
    }
    return (
      <div className="relative w-full p-4 rounded-2xl bg-white h-[95px]">
        <div className="flex justify-between items-center mb-2 text-sm text-gray-600">
          <span>보낸 사람 : {nickname}</span>
          <span>{date}</span>
        </div>
  
        <div className="text-base text-gray-800 mb-6">{messageContent}</div>
  
        <div className="absolute bottom-2 right-2 flex gap-2 text-xs">
          <RightButton onClick={() => handleAccept(requestId)} size="sm" className="text-xs px-3 py-1 h-8">
            수락
          </RightButton>
          <RightButton onClick={() => handleReject(requestId)} size="sm" className="text-xs px-3 py-1 h-8">
            거절
          </RightButton>
        </div>
      </div>
    )
  }
  
  export default FriendRequestCard
  