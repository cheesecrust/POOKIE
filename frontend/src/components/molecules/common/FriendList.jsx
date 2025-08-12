import FriendCard from '../../atoms/message/FriendCard'

const FriendList = ({ friends = [], onRemoveFriend }) => {
  // 4칸 고정
  const totalSlots = 4

  return (
    <div className="flex flex-col gap-4 w-full px-4 py-2">
      {Array.from({ length: totalSlots }).map((_, idx) => {
        const friend = friends[idx]
        if (friend) {
          return (
            <FriendCard
              key={friend.userId}
              friendId={friend.userId}
              nickname={friend.nickname}
              characterName={friend.repCharacter.characterName}
              status={friend.status}
              isOnline={friend.online === true}
              onRemoveFriend={onRemoveFriend}
            />
          )
        } else {
          // EMPTY slot
          return (
            <div
              key={`empty-${idx}`}
              className="bg-[#B78F8F] rounded-2xl w-full h-[95px] flex items-center justify-center"
            >
              <span className="font-bold text-xl tracking-wider">EMPTY</span>
            </div>
          )
        }
      })}
    </div>
  )
}

export default FriendList
