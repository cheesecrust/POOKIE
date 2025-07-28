// src/pages/SamePosePage.jsx

import KeywordModal from "../components/atoms/modal/KeywordModal";
import RoundInfo from "../components/molecules/games/RoundInfo";
import toggle_left from "../assets/icon/toggle_left.png";
import ChatBox from "../components/molecules/common/ChatBox";
import background_same_pose from "../assets/background/background_samepose.gif";

const SamePosePage = () => {
  return (
    <div
      className="flex flex-col h-screen bg-cover bg-center"
      style={{ backgroundImage: `url(${background_same_pose})` }}
    >
      <section className="basis-3/8 flex flex-col p-4">
        {/* socket에서 턴 정보 받아오기 */}
        <div className="text-center text-2xl font-bold">RED TEAM TURN</div>

        {/* 본문 전체 */}
        <div className="flex flex-row flex-1 items-center justify-between px-6">
          {/* 좌측 설명 */}
          <div className="flex flex-col text-sm text-gray-700 leading-tight w-[160px]">
            <span className="mb-2">제시어에 맞게 동작을 취하세요</span>
            <span className="text-xs">
              최대한 <b>정자세</b>에서 정확한 동작을 취해주세요.
            </span>
          </div>

          {/* 중앙 제시어 카드 */}
          <div className="flex flex-col items-center justify-center bg-[#FFDBF7] rounded-xl shadow-lg w-[400px] h-full ">
            <div className=" font-bold flex flex-row">
              <img src={toggle_left} alt="icon" className="w-5 h-5 mr-2" />
              제시어
            </div>
            <div className="text-2xl font-semibold text-black mt-2">
              {/* 제시어 받아다 써야함 */}
              야구 방망이
            </div>
          </div>

          {/* 우측 라운드 정보 */}
          <RoundInfo round={1} redScore={0} blueScore={0} />
        </div>
      </section>

      <section className="basis-3/8">{/* openVidu */}</section>
      <section className="basis-2/8 flex flex-row">
        {/* ChatBox (우측 하단 고정) */}
        <div className="absolute bottom-0 left-0 z-20">
          <div className="relative w-[300px] h-[200px] ">
            <div className="absolute bottom-0 left-0 ">
              <ChatBox width="300px" height="200px" />
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default SamePosePage;
