import characterImageMap from "../../../utils/characterImageMap";

const CharacterNode = ({ name, unlocked, isRepresent, onDoubleClick }) => {
  const imgSrc = characterImageMap[name] || characterImageMap.pookiepookie;

  return (
    <div
      onDoubleClick={onDoubleClick}
      className={`relative w-[84px] h-[84px] rounded-md border-2 overflow-hidden bg-white
                  ${unlocked ? "hover:scale-105 transition-transform" : ""} 
                  ${isRepresent ? "ring-4 ring-pink-400 shadow-[0_0_12px_rgba(236,72,153,0.6)]" : "border-black"}`}
      role="button"
      title={unlocked ? name : "잠김"}
    >
      {/* 이미지 */}
      <img
        src={imgSrc}
        alt={name}
        className={`w-full h-full object-contain p-1 ${unlocked ? "" : "brightness-0"}`}
      />

      {/* 잠금 오버레이 */}
      {!unlocked && <div className="absolute inset-0" />}

    </div>
  );
};

export default CharacterNode;
