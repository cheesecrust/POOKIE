// 경로 : src/components/molecules/dex/CharacterCard.jsx

import characterImageMap from "../../../utils/characterImageMap";

const CharacterNode = ({ name, unlocked, isRepresent, onDoubleClick }) => {
  const imgSrc = characterImageMap[name] || characterImageMap.pookiepookie;

  return (
    <div
      onDoubleClick={unlocked ? onDoubleClick : undefined}
      className={`relative w-[84px] h-[84px] rounded-md border-2 border-black overflow-hidden bg-white
                  ${unlocked ? "hover:scale-105 transition-transform" : ""}`}
      role="button"
      title={unlocked ? name : "잠김"}
    >
      <img
        src={imgSrc}
        alt={name}
        className={`w-full h-full object-contain p-1 ${unlocked ? "" : "brightness-0"}`}
      />
      {!unlocked && <div className="absolute inset-0 " />}


    </div>
  );
};

export default CharacterNode;
