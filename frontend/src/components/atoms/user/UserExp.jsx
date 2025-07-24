// 경로 : src/components/atoms/user/UserExp.jsx
// user 캐릭터 진화단계(step) , 경험치 props로 전달받으면 됩니다 

const UserExp = ({step, exp}) => {

    // 단계별 필요로하는 경험치 고정
    const maxExpByStep = {
        1: 10000,
        2: 1000000,
        3: 0,
    }

    const maxExp = maxExpByStep[step];

    const percent = maxExp > 0 ?(exp / maxExp) * 100 : 0;

    return (
        <div className="w-50 h-6 rounded-full border-2 border-gray-700 bg-gray-200 overflow-hidden">
        <div
          className="h-full bg-gray-600 transition-all duration-300"
          style={{ width: `${percent}%` }}
        ></div>
      </div>
    )
}

export default UserExp;