// src/components/organisms/waiting/GameTypeButton.jsx

import { useState, useRef, useEffect } from "react";
import RightButton from "../../atoms/button/RightButton";

const gameTypeLabels = {
  SAMEPOSE: "일심동체",
  SILENTSCREAM: "고요속의 외침",
  SKETCHRELAY: "그림이어그리기",
};

const gameTypes = ["SAMEPOSE", "SILENTSCREAM", "SKETCHRELAY"];

const GameTypeToggleButton = ({ gameType, onToggle }) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  // 바깥 클릭 시 토글 닫기
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (selectedType) => {
    if (selectedType !== gameType) {
      onToggle(selectedType);
    }
    setIsOpen(false); // 선택 후 닫기
  };

  return (
    <div className="relative inline-block" ref={containerRef}>
      <RightButton
        onClick={() => setIsOpen((prev) => !prev)}
        className="bg-[#FDE1F0] opacity-80 border border-pink-100"
      >
        {gameTypeLabels[gameType] ?? "게임 선택"}
      </RightButton>

      {isOpen && (
        <div className="absolute left-0 mt-2 w-full bg-[#FDE1F0] rounded shadow z-10 opacity-80">
          {gameTypes.map((type, index) => (
            <div
              key={type}
              className={`text-sm px-4 py-2 cursor-pointer hover:bg-pink-100 ${
                type === gameType ? "text-pink-500 font-bold" : ""
              } ${index < gameTypes.length - 1 ? "border-b border-gray-200" : ""}`}
              onClick={() => handleSelect(type)}
            >
              {gameTypeLabels[type]}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default GameTypeToggleButton;
