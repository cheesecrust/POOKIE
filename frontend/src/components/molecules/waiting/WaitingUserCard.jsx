// 사용자 대기방에서의 개별 사용자 카드 컴포넌트
// src/components/molecules/waiting/WaitingUserCard.jsx

import UserReady from "../../atoms/user/UserReady";
import pookiepookie from "../../../assets/character/pookiepookie.png";
import crown from "../../../assets/icon/crown.png";
import KickButton from "../../atoms/button/KickButton";

const WaitingUserCard = ({ user, isMe, isMyRoomMaster, onRightClickKick }) => {
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
        className={`relative w-44 h-56 border-4 ${borderColor} bg-white flex flex-col items-center justify-center p-2`}
      >
        {/* ✅ 강퇴 버튼 (방장이고, 자기 자신이 아닐 때만 표시) */}
        {isMyRoomMaster && !isMe && <KickButton onClick={handleKickClick} />}

        {/* 캐릭터 이미지 */}
        <img
          src={user.reqImg || pookiepookie}
          alt="character"
          className="w-20 h-20 object-contain mb-1"
          onError={(e) => {
            e.target.onerror = null;
            e.target.src = pookiepookie;
          }}
        />

        {/* 방장 뱃지 */}
        {user.isHost && (
          <div className="absolute top-1">
            <img src={crown} alt="방장" className="w-10 h-10" />
          </div>
        )}

        {/* Ready 뱃지 */}
        {user.isReady && <UserReady />}
      </div>

      {/* 닉네임 */}
      <div
        className={`mt-1 w-[120px] text-sm font-bold ${
          isMe ? "bg-pink-200" : "bg-white"
        } rounded px-2 py-1 text-center`}
      >
        {user.userNickname}
      </div>
    </div>
  );
};

export default WaitingUserCard;
