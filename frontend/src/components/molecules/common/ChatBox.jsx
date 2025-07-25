// 경로 : src/components/molecules/common/ChatBox.jsx
// 채팅들은 어떻게 가져올지 몰라서 일단 css만 구현 

// 상위 컴포넌트에서 쓰실 때 예시:
// <div className="relative w-[?px] h-[?px] bg-[#f8f8f8]"> w와 h는 채팅창 크기와 동일하게 하시면됩니다 
//   <div className="absolute bottom-0 left-0 right-0">  
//     <ChatBox width="?px" height="?px"/>           채팅창 원하는 크기의 w,h 값을 넣으시면됩니다. ? 은 다 동일한 값 넣어서 이용하시면됩니다.
//   </div>
// </div>

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


import { useState } from 'react';

import ChatInput from '../../atoms/input/ChatInput';

const ChatBox = ({ width , height }) => {
  const [isOpen, setIsOpen] = useState(true);

  // Tailwind에서 사용할 커스텀 width와 height 
  const ChatboxWidth = `w-[${width}]`;
  const ChatboxHeight = isOpen ? `h-[${height}]` : 'h-[50px]';

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
          <div className="flex-1 overflow-y-auto text-xs mb-2 rounded bg-white p-1"></div>
        </>
      )}

      <div className="flex items-center gap-2">
        {/* ChatInput 컴포넌트에 넘겨줄 함수들을 props로 전달 */}
        <ChatInput />
        <button
          className="w-6 h-6 rounded-full bg-sky-300 text-white text-xs flex items-center justify-center hover:bg-sky-400"
          onClick={() => setIsOpen((prev) => !prev)}
        >
          {isOpen ? '↓' : '↑'}
        </button>
      </div>
    </div>
  );
};

export default ChatBox;