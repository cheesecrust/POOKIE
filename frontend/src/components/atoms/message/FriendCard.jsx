// 경로: src/components/atoms/message/FriendCard.jsx
// 사용 예시
//   <FriendCard nickname="다예" characterName="pudding_strawberry" isOnline={true} onSendMessage={() => {}} />

// 필요 기능: 쪽지 보내기 


import UserCharacter from '../user/UserCharacter'
import RightButton from '../button/RightButton'
import SendMessageModal from './SendMessageModal'
import { useState } from 'react'

const FriendCard = ({ characterName, nickname, isOnline, friendId, onRemoveFriend}) => {

  // 쪽지보내기 모달 상태
  const [isModalOpen, setIsModalOpen] = useState(false)

  const handleModalOpen = () => {
    setIsModalOpen(true)
  }

  const handleModalClose = () => {
    setIsModalOpen(false)
  }

  return (
    <div className="flex items-center justify-between bg-white p-4 rounded-2xl w-full h-[95px]">
      <div className="flex items-center gap-4">
        <UserCharacter name="pooding_strawberry" size={80} />
        <div className="flex flex-col">
          <span className="text-lg font-bold">{nickname}</span>
        </div>
      </div>

      <div className="flex items-center gap-2 text-base ">
        <span
          className={`w-4 h-4 rounded-full ${
            isOnline ? 'bg-green-400' : 'bg-gray-300'
          }`}
        ></span>
        <span className="font-bold">{isOnline ? 'Online' : 'Offline'}</span>
      </div>

      <RightButton size="sm" onClick={handleModalOpen}>
        쪽지보내기
      </RightButton>
      {isModalOpen && (
        <SendMessageModal onClose={handleModalClose} friendId={friendId} />
      )}
      <RightButton size="sm" onClick={() => onRemoveFriend(friendId)}>
        친구삭제
      </RightButton>
    </div>


  )
}

export default FriendCard
