// src/components/atoms/input/SubmitInput.jsx
// 사용 예시:
// useState import 필수
// const [text, setText] = useState("");
// 함수 선언 필수
// const handleSubmit = () => {
//   console.log("제출!", text);
//   setText("");
// }
// const handleKeyDown = (e) => {
//   if (e.key === "Enter") {
//     console.log("엔터 입력됨!", text);
//     setText("");
//   }
// }
// <SubmitInput
//   value={text}
//   onChange={(e) => setText(e.target.value)}
//   onKeyDown={handleKeyDown}
//   onClick={handleSubmit}
//   placeholder="내용을 입력하세요"
// />

import submitButton from "../../../assets/icon/submit_left.png"

const SubmitInput = ({ value, onChange, onKeyDown, onClick, placeholder }) => {
    return (
        <div className="relative w-[500px]">
          <input
            type="text"
            value={value}
            onChange={onChange}
            onKeyDown={onKeyDown}
            placeholder={placeholder}
            className="w-full h-[100px] pl-4 pr-12 rounded-[30px] shadow-md outline-none bg-white text-4xl text-black"
          />
          <button
            type="submit"
            onClick={onClick}
            className="absolute top-1/2 right-3 -translate-y-1/2 w-14 h-14 mr-4"
          >
            <img
              src={submitButton}
              alt="submit"
              className="w-full h-full object-contain"
            />
          </button>
        </div>
      );
    };

export default SubmitInput
