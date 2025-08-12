// 사용자 대기방에서의 개별 사용자 카드 컴포넌트
// src/components/molecules/waiting/WaitingUserCard.jsx

import UserReady from "../../atoms/user/UserReady";
import pookiepookie from "../../../assets/character/pookiepookie.png";
import crown from "../../../assets/icon/crown.png";
import KickButton from "../../atoms/button/KickButton";
import characterImageMap from "../../../utils/characterImageMap";
import entryEffect from "../../../assets/effect/entry.gif";

const WaitingUserCard = ({
  user,
  isMe,
  isMyRoomMaster,
  onRightClickKick,
  showEntry = false,
}) => {
  const borderColor =
    user.team === "red" ? "border-red-500" : "border-blue-500";

  const handleContextMenu = (e) => {
    e.preventDefault();
    if (isMyRoomMaster && !isMe) {
      onRightClickKick?.(user);
    }
  };

  const handleKickClick = () => {
    if (isMyRoomMaster && !isMe) {
      onRightClickKick?.(user);
    }
  };

  return (
    <div
      className="flex flex-col items-center"
      onContextMenu={handleContextMenu}
    >
      <div
        className={`relative w-52 h-64 border-4 ${borderColor} bg-red-50 flex flex-col items-center justify-center p-2`}
      >
        {/* ✅ 강퇴 버튼 (방장이고, 자기 자신이 아닐 때만 표시) */}
        {isMyRoomMaster && !isMe && <KickButton onClick={handleKickClick} />}

        {/* 캐릭터 이미지 + 입장 이펙트 */}
        <div className="relative w-24 h-24 mb-1">
          {/* 캐릭터 이미지 */}
          <img
            src={characterImageMap[user?.characterName] || pookiepookie}
            alt="character"
            className="w-24 h-24 object-contain mb-1"
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = pookiepookie;
            }}
          />

          {/* 입장 이펙트 */}
          {showEntry && (
            <img
              src={entryEffect}
              alt="entry effect"
              aria-hidden
              className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 
                 w-full h-full object-contain pointer-events-none z-30 scale-150"
            />
          )}
        </div>

        {/* 방장 뱃지 */}
        {user.isHost && (
          <div className="absolute top-1 flex items-center">
            <img src={crown} alt="방장" className="w-16 h-16" />
          </div>
        )}

        {/* Ready 뱃지 */}
        {user.isReady && <UserReady team={user.team} />}
      </div>

      {/* 닉네임 */}
      <div
        className={`mt-2 truncate w-[120px] text-sm font-bold ${
          isMe ? "bg-violet-400/90" : "bg-red-50"
        } rounded px-2 py-1 text-center`}
      >
        {user.userNickname}
      </div>
    </div>
  );
};

export default WaitingUserCard;
