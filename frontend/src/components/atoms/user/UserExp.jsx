// 경로 : src/components/atoms/user/UserExp.jsx
// user 캐릭터 진화단계(step) , 경험치(exp) + [forceFull] 선택적으로 전달

const UserExp = ({ step, exp, forceFull = false }) => {
  const maxExpByStep = { 0: 100, 1: 200, 2: 0 }; // 2는 만렙
  const maxExp = maxExpByStep[step];

  // 강제 FULL 또는 만렙이면 100%
  let percent;
  if (forceFull || step === 2) {
    percent = 100;
  } else {
    percent = maxExp > 0 ? (exp / maxExp) * 100 : 0;
  }

  const isFull = percent >= 100;

  return (
    <div className="w-50 h-6 rounded-full border-2 border-gray-700 bg-gray-200 overflow-hidden relative" aria-label="exp-bar">
      <div
        className={`h-full transition-all duration-300 ${isFull ? "bg-yellow-400" : "bg-gray-600"}`}
        style={{ width: `${percent}%` }}
      />
      {isFull && (
        <span className="absolute inset-0 flex items-center justify-center text-xs font-bold text-black">
          FULL
        </span>
      )}
    </div>
  );
};

export default UserExp;
