// src/pages/SilentScreamPage.jsx

import backgroundSilentScream from "../assets/background/background_silentscream.gif"
import RoundInfo from "../components/molecules/games/RoundInfo";
import ChatBox from "../components/molecules/common/ChatBox";

const SilentScreamPage = () => {
  return (
    <div className="relative w-full h-screen overflow-hidden">
      {/* 배경 이미지는 absolute로 완전 뒤로 보내야 함 */}
      <img
        src={backgroundSilentScream}
        alt="background_silentScream"
        className="absolute top-0 left-0 w-full h-full object-cover -z-10"
      />

      {/*  모든 컨텐츠는 여기서 relative 위치로 올라감 */}
      <div className="relative z-10 w-full h-full flex flex-col items-center py-12 px-10">
        {/* 현재 팀 턴 */}
        <div className="text-center text-3xl font-bold">
          RED TEAM TURN
        </div>

        {/* 🔴 현재팀 캠 */}
        <div className="relative w-full h-[350px]">
          {/* user1 - 왼쪽 크게 */}
          <div className="absolute top-10 left-5 w-180 h-125 bg-white rounded-lg shadow-lg">
            <p className="text-start text-4xl px-5 py-110">
             user1
            </p>
          </div>

          {/* user2 */}
          <div className="absolute top-10 left-195 w-90 h-60 bg-white rounded-lg shadow-lg">
            <p className="text-start text-2xl px-5 py-50">
              user2
            </p>
          </div>

          {/* user3 */}
          <div className="absolute top-75 left-195 w-90 h-60 bg-white rounded-lg shadow-lg">
            <p className="text-start text-2xl px-5 py-50">
              user3
            </p>
          </div>

        </div>


        {/* 상대팀 캠 */}
        <div className="relative w-full h-[180px] mt-auto">
          {/* 상대 팀 턴 */}
          <div className="absolute bottom-65 right-12 text-3xl font-bold">
            BLUE TEAM
          </div>
          {/* user4 */}
          <div className="absolute bottom-0 right-170 w-75 h-60 bg-white rounded-lg shadow-lg">
            <p className="text-start text-2xl px-5 py-50">
              user4
            </p>
          </div>

          {/* user5 */}
          <div className="absolute bottom-0 right-90 w-75 h-60 bg-white rounded-lg shadow-lg">
            <p className="text-start text-2xl px-5 py-50">
              user5
            </p>
          </div>

          {/* user6 */}
          <div className="absolute bottom-0 right-10 w-75 h-60 bg-white rounded-lg shadow-lg">
            <p className="text-start text-2xl px-5 py-50">
              user6
            </p>
          </div>

        </div>

        {/* RoundInfo (우측 상단 고정) */}
        <div className="absolute top-6 right-8 z-20">
          <RoundInfo round={1} redScore={0} blueScore={0} />
        </div>

        {/* ChatBox (우측 하단 고정) */}
        <div className="absolute bottom-4 left-15 z-20 opacity-80">
          <div className="relative w-[550px] h-[400px] "> 
            <div className="absolute bottom-5 left-0 ">  
              <ChatBox width="550px" height="400px" />          
            </div>
          </div>
        </div>

      </div>
    </div>

  );
}

export default SilentScreamPage;

