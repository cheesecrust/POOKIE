// src/components/molecules/RoundInfo.jsx

//round 와 teamscore 서버에서 받아서 써야함

// 사용예시
{
  /* <RoundInfo
  redScore={room.teamScores.Red}
  blueScore={room.teamScores.Blue}
  round={room.round}
/> */
}

const RoundInfo = ({
  round = 0,
  redScore = 0,
  blueScore = 0,
  className = "",
}) => {
  return (
    <div
      className={`${className} flex flex-col items-center gap-2 text-center font-pixel text-black`}
    >
      {/* 라운드 표시 */}
      <p className="text-xl tracking-widest">ROUND {round}</p>

      {/* 빨간 팀 점수 */}
      <div className="w-16 h-16 flex items-center justify-center rounded-xl bg-pink-400">
        <span className="text-3xl">{redScore}</span>
      </div>

      {/* 파란 팀 점수 */}
      <div className="w-16 h-16 flex items-center justify-center rounded-xl bg-indigo-200">
        <span className="text-3xl">{blueScore}</span>
      </div>
    </div>
  );
};

export default RoundInfo;
