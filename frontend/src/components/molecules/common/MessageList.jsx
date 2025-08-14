import MessageCard from '../../atoms/message/MessageCard'
import FriendRequestCard from '../../atoms/message/FriendRequestCard'

const MessageList = ({ messageType, messages = [], onDelete, onAccept, onReject}) => {
  const totalSlots = 4

  return (
    <div className="flex flex-col gap-4 w-full px-4 py-2">
      {Array.from({ length: totalSlots }).map((_, idx) => {
        const message = messages[idx]
        if (message) {
          // 메시지 유형 별로 렌더링 다름
          if (messageType === 'received') {
            if (message.type === 'FRIEND_REQUEST') {
              return (
                <FriendRequestCard
                  key={idx}
                  nickname={message.senderNickname}
                  date={message.createdAt}
                  messageContent="친구 요청이 왔습니다!"
                  requestId={message.requestId}
                  onAccept={onAccept}
                  onReject={onReject}
                  onDelete={onDelete}
                />
              )
            } else if (message.type === 'LETTER') {
                return (
                  <MessageCard
                    key={idx}
                    messageType={messageType}
                    nickname={message.senderNickname}
                  date={message.createdAt}
                  messageContent={message.message}
                  requestId={message.requestId}
                  isRead={message.status}
                  onDelete={onDelete}
                />
              )
            }
          } else if (messageType === 'sent') {
              return (
                <MessageCard
                  key={idx}
                  messageType={messageType}
                  nickname={message.receiverNickname}
                date={message.createdAt}
                messageContent={message.message}
                requestId={message.requestId}
                status={message.status}
                onDelete={onDelete}
              />
            )
          }
          return (
            <MessageCard
              key={idx}
              messageType={messageType}
              nickname={message.nickname}
            date={message.date}
              messageContent={message.messageContent}
              isRead={message.isRead}
              onDelete={onDelete}
            />
          )
        } else {
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

export default MessageList
