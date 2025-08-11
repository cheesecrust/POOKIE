// 경로 : src/components/atoms/user/UserExp.jsx
// user 캐릭터 진화단계(step) , 경험치 props로 전달받으면 됩니다 

const UserExp = ({ step, exp }) => {
  // 단계별 필요 경험치
  const maxExpByStep = {
    0: 100,
    1: 200,
    2: 0, // 만렙
  };

  const maxExp = maxExpByStep[step];

  let percent = 0;
  if (step === 2) {
    percent = 100; // 만렙 고정
  } else {
    percent = maxExp > 0 ? (exp / maxExp) * 100 : 0;
  }

  const isMaxLevel = step === 2;

  return (
    <div className="w-50 h-6 rounded-full border-2 border-gray-700 bg-gray-200 overflow-hidden relative">
      {/* 게이지 바 */}
      <div
        className={`h-full transition-all duration-300 ${
          isMaxLevel ? "bg-yellow-400" : "bg-gray-600"
        }`}
        style={{ width: `${percent}%` }}
      ></div>

      {/* FULL 글씨 */}
      {isMaxLevel && (
        <span className="absolute inset-0 flex items-center justify-center text-xs font-bold text-black">
          FULL
        </span>
      )}
    </div>
  );
};

export default UserExp;
