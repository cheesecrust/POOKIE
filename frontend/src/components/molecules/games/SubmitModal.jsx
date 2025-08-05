import { useState } from 'react';
import SubmitInput from "../../atoms/input/SubmitInput";

const SubmitModal = ({ isOpen, onClose, onSubmit }) => {
  const [text, setText] = useState("");

  const handleSubmit = () => {
    if (text.trim() !== "") {
      onSubmit(text);
      setText("");
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      handleSubmit();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-opacity-40 flex items-center justify-center z-50">
      <div className="bg-[#EFDDEB] rounded-2xl shadow-lg px-8 py-6 w-[600px] flex flex-col items-center">
        {/* 제목 */}
        <h2 className="text-2xl font-bold mb-6 pixel-font text-black">
          정답을 입력하세요!
        </h2>

        {/* 인풋 영역 */}
        <SubmitInput
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          onClick={handleSubmit}
        />
      </div>
    </div>
  );
};

export default SubmitModal;
