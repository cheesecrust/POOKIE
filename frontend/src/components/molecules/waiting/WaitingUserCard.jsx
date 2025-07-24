// 사용자 대기방에서의 개별 사용자 카드 컴포넌트
// src/components/molecules/waiting/WaitingUserCard.jsx

import UserReady from "../../atoms/user/UserReady";
import pookiepookie from "../../../assets/character/pookiepookie.png";

const WaitingUserCard = ({ user }) => {
  const borderColor =
    user.team === "red" ? "border-red-500" : "border-blue-500";

  return (
    <div className="flex flex-col items-center">
      {/* 카드 박스 */}
      <div
        className={`
          relative
          w-24 sm:w-28 md:w-32 lg:w-36 xl:w-40
          aspect-[3/4]
          rounded-xl
          border-4
          ${borderColor}
          bg-white
          flex flex-col items-center justify-center
          p-2
        `}
      >
        {/* 캐릭터 이미지 */}
        <img
          src={user.character || pookiepookie}
          alt="character"
          className="w-16 h-16 object-contain mb-1"
          onError={(e) => {
            e.target.onerror = null; // 무한 루프 방지
            e.target.src = { pookiepookie }; // 기본 이미지로 대체
          }}
        />

        {/* 방장 뱃지 */}
        {user.isHost && (
          <div className="absolute top-1 left-1 bg-yellow-300 text-[10px] font-bold px-1 rounded">
            방장
          </div>
        )}

        {/* Ready 뱃지 */}
        {user.isReady && <UserReady />}
      </div>

      {/* 닉네임 (카드 외부 아래에) */}
      <p className="mt-1 text-xs font-bold">{user.username}</p>
    </div>
  );
};

export default WaitingUserCard;
