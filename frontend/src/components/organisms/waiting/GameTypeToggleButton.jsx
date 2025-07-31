// src/components/organisms/waiting/GameTypeToggleButton.jsx

import { useState, useRef, useEffect } from "react";
import RightButton from "../../atoms/button/RightButton";

const gameTypeLabels = {
  SAMEPOSE: "일심동체",
  SILENTSCREAM: "고요속의외침",
  SKETCHRELAY: "그림이어그리기",
};

const gameTypes = ["SAMEPOSE", "SILENTSCREAM", "SKETCHRELAY"];

// 게임 타입과 게임 타입 변경 함수, 방장 여부를 받아옴
const GameTypeToggleButton = ({ gameType, onToggle, isHost }) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // 선택하면 자동 닫힘
  const handleSelect = (selectedType) => {
    if (!isHost) return;
    if (selectedType !== gameType) {
      onToggle(selectedType);
    }
    setIsOpen(false);
  };

  return (
    <div className="relative inline-block" ref={containerRef}>
      <RightButton
        onClick={() => isHost && setIsOpen((prev) => !prev)}
        className={`w-36 bg-[#FDE1F0] opacity-95 border rounded-md border-pink-300 ${
          !isHost ? "cursor-default text-gray-800" : ""
        }`}
      >
        {gameTypeLabels[gameType] ?? "게임 선택"}
      </RightButton>

      {/* 게임 타입 선택 드롭롭 */}
      {isOpen && isHost && (
        <div className="absolute left-0 mt-2 w-full bg-[#FDE1F0] rounded-md shadow z-10 opacity-70">
          {gameTypes.map((type, index) => (
            <div
              key={type}
              className={`text-sm px-4 py-2 cursor-pointer hover:bg-white ${
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
