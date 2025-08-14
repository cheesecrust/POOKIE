// 경로: src/components/atoms/message/FriendCard.jsx
// 사용 예시
//   <FriendCard nickname="다예" characterName="pudding_strawberry" isOnline={true} onSendMessage={() => {}} />

// 필요 기능: 쪽지 보내기 


import UserCharacter from '../user/UserCharacter'
import RightButton from '../button/RightButton'
import SendMessageModal from './SendMessageModal'
import { useState } from 'react'

const FriendCard = ({ characterName, nickname, status,isOnline, friendId, onRemoveFriend}) => {

  // 쪽지보내기 모달 상태
  const [isModalOpen, setIsModalOpen] = useState(false)

  const handleModalOpen = () => {
    setIsModalOpen(true)
  }

  const handleModalClose = () => {
    setIsModalOpen(false)
  }
  

  return (
    <div className="flex items-center justify-between bg-white p-4 rounded-2xl w-full h-[95px] gap-4">
      {/* 왼쪽: 아바타 + 닉네임 */}
      <div className="flex items-center gap-4 flex-1 min-w-0">
        <UserCharacter name={characterName} size={80} />
        <div className="min-w-0">
          <span className="block text-lg font-bold truncate">
            {nickname}
          </span>
        </div>
      </div>

      {/* 가운데: 온라인 표시 (줄어들지 않음) */}
      <div className="flex items-center gap-2 text-base shrink-0">
        <span className={`w-4 h-4 rounded-full ${isOnline ? 'bg-green-400' : 'bg-gray-300'}`} />
        <span className="font-bold">{isOnline ? 'Online' : 'Offline'}</span>
      </div>

      {/* 오른쪽 버튼들 (줄어들지 않음) */}
      <div className="flex items-center gap-2 shrink-0">
        <RightButton size="sm" onClick={() => setIsModalOpen(true)}>쪽지보내기</RightButton>
        {isModalOpen && <SendMessageModal onClose={() => setIsModalOpen(false)} friendId={friendId} />}
        <RightButton size="sm" onClick={() => onRemoveFriend(friendId)}>친구삭제</RightButton>
      </div>
  </div>
    );
}

export default FriendCard
