// 경로 : src/components/molecules/common/ChatBox.jsx
// 채팅들은 어떻게 가져올지 몰라서 일단 css만 구현 

// 상위 컴포넌트에서 쓰실 때 예시:
// <div className="relative w-[500px] h-[500px] bg-[#f8f8f8]"> w랑 h 채팅창 크기와 동일하게 하시면됩니다 
//   <div className="absolute bottom-0 left-0 right-0">  
//     <ChatBox width="300px" height="300px"/>           채팅창 원하는 w,h 값을 넣으시면됩니다.
//   </div>
// </div>

import { useState } from 'react';

const ChatBox = ({ width = '260px', height = '180px' }) => {
  const [isOpen, setIsOpen] = useState(true);

  return (
    <div
      className="rounded-xl shadow-md p-2 flex flex-col justify-end transition-all duration-200 bg-[#DCDCDC] overflow-hidden"
      style={{
        width,
        height: isOpen ? height : '50px',
      }}
    >
      {isOpen && (
        <>
          <div className="font-bold text-sm mb-1">CHAT</div>
          <div className="flex-1 overflow-y-auto text-xs mb-2 rounded bg-white p-1"></div>
        </>
      )}

      <div className="flex items-center gap-2">
        <input
          type="text"
          className="flex-1 rounded px-2 py-1 text-sm bg-white"
          placeholder="메시지를 입력하세요"
        />
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
