// 경로: src/components/atoms/message/FriendCard.jsx
// 사용 예시
//   <FriendCard nickname="다예" characterName="pudding_strawberry" isOnline={true} onSendMessage={() => {}} />

import UserCharacter from '../user/UserCharacter'
import RightButton from '../button/RightButton'

const FriendCard = ({ characterName, nickname, isOnline, onMessage }) => {
  return (
    <div className="flex items-center justify-between bg-white p-4 rounded-2xl w-full shadow border border-gray-300">
      {/* 캐릭터 이미지 */}
      <div className="flex items-center gap-4">
        <UserCharacter name={characterName} size={80} />
        <div className="flex flex-col">
          <span className="text-lg font-bold">{nickname}</span>
        </div>
      </div>

      {/* 온라인 상태 */}
      <div className="flex items-center gap-2 text-base ">
        <span
          className={`w-4 h-4 rounded-full ${
            isOnline ? 'bg-green-400' : 'bg-gray-300'
          }`}
        ></span>
        <span className="font-bold">{isOnline ? 'Online' : 'Offline'}</span>
      </div>

      {/* 쪽지 보내기 버튼 */}
      <RightButton size="sm" onClick={onMessage}>
        쪽지보내기
      </RightButton>
    </div>
  )
}

export default FriendCard
