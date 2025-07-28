import MessageCard from '../../atoms/message/MessageCard'

const MessageList = ({ messageType, messages = [] }) => {
  const totalSlots = 4

  return (
    <div className="flex flex-col gap-4 w-full px-4 py-2">
      {Array.from({ length: totalSlots }).map((_, idx) => {
        const message = messages[idx]
        if (message) {
          return (
            <MessageCard
              key={idx}
              messageType={messageType}
              nickname={message.nickname}
              date={message.date}
              messageContent={message.messageContent}
              isRead={message.isRead}
              onDelete={message.onDelete}
              onReport={message.onReport}
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
