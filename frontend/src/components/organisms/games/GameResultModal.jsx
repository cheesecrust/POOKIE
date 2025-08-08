import React from "react";

const GameResultModal = ({ win, redTeam = [], blueTeam = [], onClose }) => {
  const getCoinForPlayer = (team) => {
    if (win === "DRAW") return 100;
    if (win === team) return 300;
    return 100;
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-opacity-50 z-50 font-pixel">
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
          {win === "DRAW"
            ? "DRAW !"
            : win === "RED"
              ? "RED TEAM WIN !"
              : "BLUE TEAM WIN !"}
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
              <div
                key={player.id}
                className="flex justify-between text-black text-lg"
              >
                <span>{player.nickname}</span>
                <span>+{getCoinForPlayer("RED")}coin</span>
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
              <div
                key={player.id}
                className="flex justify-between text-black text-lg"
              >
                <span>{player.nickname}</span>
                <span>+{getCoinForPlayer("BLUE")}coin</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default GameResultModal;
