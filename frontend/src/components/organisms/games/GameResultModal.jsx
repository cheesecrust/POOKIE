import React from "react";

const GameResultModal = ({ win, isNormalEnd, isAbnormalPerson, redTeam = [], blueTeam = [], onClose }) => {
  const getCoinForPlayer = (team) => {
    if (isNormalEnd === false) {
      if (win === "DRAW") return 50;
      if (win === team) return 50;
      return 0;
    }
    if (isNormalEnd === true) {
      if (win === "DRAW") return 100;
      if (win === team) return 100;
      return 0;
    }
    return 0;
  };

  // 닉네임이 중도이탈자와 같은지 체크 (널/공백 대비)
  const isAbnormalNickname = (nickname) => {
    if (!isAbnormalPerson) return false;
    return String(nickname ?? "").trim() === String(isAbnormalPerson ?? "").trim();
  };

  // 최종 코인 계산: 이탈자는 0, 아니면 팀 결과에 따라
  const calcCoins = (team, nickname) => {
    if (isAbnormalNickname(nickname)) return 0;
    return getCoinForPlayer(team);
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50 font-pixel">
      <div
        className="
          relative bg-pink-300 p-6
          border-[6px] border-pink-500
          rounded-none
          shadow-[4px_4px_0_0_rgba(0,0,0,1)]
          w-[420px]
        "
      >
        {/* 제목 */}
        <h2 className="text-center text-3xl font-bold mb-2">RESULT</h2>
        <p className="text-center text-xl font-bold mb-6">
          {win === "DRAW" ? "DRAW !" : win === "RED" ? "RED TEAM WIN !" : "BLUE TEAM WIN !"}
        </p>

        {/* RED TEAM */}
        <div className="mb-4">
          <h3 className="text-red-600 font-bold mb-1">RED</h3>
          <div
            className="
              bg-white p-2 border-[4px] border-red-500
              shadow-[2px_2px_0_0_rgba(0,0,0,1)]
            "
          >
            {redTeam.map((player) => (
              <div key={player.id} className="flex justify-between text-black text-lg">
                <span>
                  {player.nickname}
                  {isAbnormalNickname(player.nickname) && (
                    <span className="ml-2 text-xs text-red-500 align-middle">(중도 이탈)</span>
                  )}
                </span>
                <span>+{calcCoins("RED", player.nickname)}coin</span>
              </div>
            ))}
          </div>
        </div>

        {/* BLUE TEAM */}
        <div>
          <h3 className="text-blue-600 font-bold mb-1">BLUE</h3>
          <div
            className="
              bg-white p-2 border-[4px] border-blue-500
              shadow-[2px_2px_0_0_rgba(0,0,0,1)]
            "
          >
            {blueTeam.map((player) => (
              <div key={player.id} className="flex justify-between text-black text-lg">
                <span>
                  {player.nickname}
                  {isAbnormalNickname(player.nickname) && (
                    <span className="ml-2 text-xs text-red-500 align-middle">(중도 이탈)</span>
                  )}
                </span>
                <span>+{calcCoins("BLUE", player.nickname)}coin</span>
              </div>
            ))}
          </div>
        </div>

        {/* 닫기 버튼(원하면) */}
        {/* <button onClick={onClose} className="mt-4 w-full border-2 border-black bg-white py-2">확인</button> */}
      </div>
    </div>
  );
};

export default GameResultModal;
