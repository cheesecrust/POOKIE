// src/components/molecules/RoundInfo.jsx

//round 정보 받아오고 teamscore? tempteamscore 받아서 써야함. 추후 다시

const RoundInfo = ({ round = 1, redScore = 0, blueScore = 0 }) => {
  return (
    <div className="flex flex-col items-center gap-2 text-center font-pixel text-black">
      {/* 라운드 표시 */}
      <p className="text-lg tracking-widest">ROUND {round}</p>

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
