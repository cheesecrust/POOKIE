// src/components/atoms/input/ChatInput.jsx
// 사용 예시:
// useState import 필수
// const [text, setText] = useState("");
// 함수 선언 필수
// const handleKeyDown = (e) => {
//   if (e.key === "Enter") {
//     console.log("엔터 입력됨!", text);
//     setText("");
//   }
// }
// <ChatInput
//   value={text}
//   onChange={(e) => setText(e.target.value)}
//   onKeyDown={handleKeyDown}
//   placeholder="내용을 입력하세요"
// />


const ChatInput = ({ value, onChange, onKeyDown, placeholder }) => {
    return (
        <div className="relative flex-1">
          <input
            type="text"
            value={value}
            onChange={onChange}
            onKeyDown={onKeyDown}
            placeholder={placeholder}
            className="w-full h-[30px] pl-4 pr-10 rounded-md bg-[#FFF7F7] text-black text-lg outline-none shadow-sm"
          />
          <span className="absolute top-1/2 right-3 -translate-y-1/2 text-black text-xl select-none">
            ↵
          </span>
        </div>
    );
};

export default ChatInput