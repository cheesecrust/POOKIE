// 경로 : src/components/molecules/common/ChatBox.jsx
// 채팅들은 어떻게 가져올지 몰라서 일단 css만 구현

// 상위 컴포넌트에서 쓰실 때 예시:
{
  /* <div className="absolute bottom-0">
<ChatBox className="w-full" height="300px" roomId={room.id} team={team}/>
</div>
</div> */
}

// 함수 선언 필수
// ChatInput 컴포넌트에 넘겨줄줄 함수들은 추후 소켓 서버 연동 후 구현 해야할 것 같습니다:
// ChatInput 컴포넌트에서 사용할 함수들
// const handleKeyDown = (e) => {
//   if (e.key === "Enter") sendMessage();
// };
// const onChange = () => {
//   // socket.emit("chat", text);
//   // setMessages((prev) => [...prev, { sender: "me", content: text }]);
// };
import { useState, useEffect, useRef } from "react";
import { getSocket } from "../../../sockets/websocket";
import { emitChatMessage } from "../../../sockets/chat/emit";
import {
  handleChatMessage,
  handleSystemMessage,
} from "../../../sockets/chat/onMessage";
import useAuthStore from "../../../store/useAuthStore";

import ChatInput from "../../atoms/input/ChatInput";
import RightButton from "../../atoms/button/RightButton";

const ChatBox = ({ width, height, roomId, team }) => {
  const [isOpen, setIsOpen] = useState(true);
  const [showDropdown, setShowDropdown] = useState(false);
  const [chatTarget, setChatTarget] = useState("전체 채팅");
  const [chatText, setChatText] = useState("");
  const [messages, setMessages] = useState([]);
  const socketRef = useRef(null);
  const { user } = useAuthStore();
  const scrollRef = useRef(null);

  const ChatboxWidth = `w-[${width}]`;
  const ChatboxHeight = isOpen ? `h-[${height}]` : "h-[50px]";

  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;
    socketRef.current = socket;

    const handleMessage = (e) => {
      const data = JSON.parse(e.data);
      if (data.type === "CHAT") {
        handleChatMessage(data, setMessages);
      } else if (data.msg) {
        handleSystemMessage(data, setMessages);
      }
    };

    socket.addEventListener("message", handleMessage);
    return () => socket.removeEventListener("message", handleMessage);
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSelect = (target) => {
    setChatTarget(target);
    setShowDropdown(false);
  };

  const handleSendMessage = () => {
    if (!chatText.trim()) return;

    // const roomId = "ROOM_ID"; // ✅ 추후 props 또는 상태에서 받아와야 함
    const targetTeam = chatTarget === "팀 채팅" ? team : "ALL";

    emitChatMessage({
      roomId,
      team: targetTeam,
      message: chatText,
      user: {
        userId: user.id,
        userNickname: user.nickname,
      },
    });

    setChatText("");
  };

  return (
    <div
      className={`
        rounded-xl shadow-md p-2 flex flex-col justify-end
        transition-all duration-200 bg-[#DCDCDC] overflow-hidden
        ${ChatboxWidth} ${ChatboxHeight}
      `}
    >
      {isOpen && (
        <>
          <div className="font-bold text-sm mb-1">CHAT</div>
          <div className="flex-1 overflow-y-auto text-xs mb-2 rounded bg-white p-1 space-y-1">
            {messages.map((msg, idx) => (
              <div key={idx}>
                {msg.type === "chat" ? (
                  <span
                    className={`break-words ${
                      msg.team === "RED"
                        ? "text-red-500 font-semibold"
                        : msg.team === "BLUE"
                          ? "text-blue-500 font-semibold"
                          : ""
                    }`}
                  >
                    [{msg.from}]: {msg.message}
                  </span>
                ) : (
                  <span className="text-gray-500 italic break-words">
                    💬 {msg.message}
                  </span>
                )}
              </div>
            ))}
            <div ref={scrollRef} />
          </div>
        </>
      )}

      <div className="flex items-center gap-1 relative">
        {/* 채팅 대상 선택 버튼 */}
        <div className="relative min-w-[60px]">
          <RightButton
            onClick={() => setShowDropdown((prev) => !prev)}
            size="sm"
            className="w-[60px] h-[28px] px-1 py-0 text-xs whitespace-nowrap flex items-center justify-center"
          >
            [{chatTarget === "팀 채팅" ? "팀" : "전체"}]
          </RightButton>

          {showDropdown && (
            <div className="absolute bottom-full left-0 mb-1 z-10 flex flex-col bg-white border border-black shadow min-w-[60px]">
              {chatTarget !== "팀 채팅" && (
                <RightButton
                  onClick={() => handleSelect("팀 채팅")}
                  size="sm"
                  className="rounded-none text-xs h-[28px] whitespace-nowrap flex items-center justify-center"
                >
                  [팀]
                </RightButton>
              )}
              {chatTarget !== "전체 채팅" && (
                <RightButton
                  onClick={() => handleSelect("전체 채팅")}
                  size="sm"
                  className="rounded-none text-xs h-[28px] whitespace-nowrap flex items-center justify-center"
                >
                  [전체]
                </RightButton>
              )}
            </div>
          )}
        </div>

        {/* 입력창 (chatText 상태 관리 & Enter 처리) */}
        <ChatInput
          value={chatText}
          onChange={(e) => setChatText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              handleSendMessage();
            }
          }}
          placeholder={`${chatTarget}`}
        />

        {/* 열고 닫기 버튼 */}
        <button
          className="w-6 h-6 rounded-full bg-sky-300 text-white text-xs flex items-center justify-center hover:bg-sky-400"
          onClick={() => setIsOpen((prev) => !prev)}
        >
          {isOpen ? "↓" : "↑"}
        </button>
      </div>
    </div>
  );
};

export default ChatBox;
