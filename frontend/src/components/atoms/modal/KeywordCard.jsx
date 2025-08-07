// src/components/atoms/card/KeywordCard.jsx
import toggleLeft from "../../../assets/icon/toggle_left.png";

const KeywordCard = ({ keyword }) => {
  if (!keyword) return null;

  return (
    <div className="bg-pink-100 rounded-full w-[300px] h-[160px] flex flex-col items-center px-6 py-6 shadow-md">
      {/* 상단: 픽셀 아이콘 + 제시어 */}
      <div className="flex items-center gap-3 mb-4">
        <img
          src={toggleLeft}
          alt="left"
          className="w-14 h-14"
        />
        <span className="text-xl text-black">제시어</span>
      </div>

      {/* 제시어 텍스트 */}
      <div className="text-2xl text-black text-center leading-tight">
        {keyword}
      </div>
    </div>
  );
};

export default KeywordCard;
