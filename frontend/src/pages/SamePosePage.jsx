// src/pages/SamePosePage.jsx

import RoundInfo from "../components/molecules/games/RoundInfo";
import toggle_left from "../assets/icon/toggle_left.png";
import ChatBox from "../components/molecules/common/ChatBox";
import background_same_pose from "../assets/background/background_samepose.gif";
import { useEffect, useState } from "react";
import { getSocket } from "../sockets/websocket";
// import { handleSamePoseMessage } from "../sockets/samePose/onMessage";

const SamePosePage = () => {
  const [keyword, setKeyword] = useState("");
  const [turn, setTurn] = useState(""); // 턴 RED인지 BLUE인지지

  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    const handleMessage = (e) => {
      try {
        const msg = JSON.parse(e.data);
        // handleSamePoseMessage(msg, {
        //   onKeywordReceived: (msg) => {
        //     const receivedKeyword = msg.KeywordList?.[0];
        //     if (receivedKeyword) setKeyword(receivedKeyword);
        //   },
        //   onStartedGame: (msg) => {
        //     setTurn(msg.turn);
        //   },
        // });
      } catch (err) {
        console.error("[SamePosePage] 메시지 파싱 실패:", err);
      }
    };

    socket.addEventListener("message", handleMessage);
    return () => socket.removeEventListener("message", handleMessage);
  }, []);

  return (
    <div
      className="flex flex-col h-screen bg-cover bg-center"
      style={{ backgroundImage: `url(${background_same_pose})` }}
    >
      <section className="basis-3/8 flex flex-col p-4">
        {/* socket에서 턴 정보 받아오기 */}

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
          <div>
            {/* 턴 정보 */}
            <div className="text-center text-2xl">{`${turn} TEAM TURN`}</div>
            {/* 제시어 카드 */}
            <div className="flex flex-col items-center justify-center bg-[#FFDBF7] rounded-xl shadow-lg w-[400px] h-[180px] gap-5 ">
              <div className="text-2xl text-pink-500 font-bold flex flex-row items-center">
                <img src={toggle_left} alt="icon" className="w-5 h-5 mr-2" />
                <p>제시어</p>
              </div>
              <p className="text-2xl font-semibold text-black mt-2">
                {/* 제시어 받아다 써야함 */}
                {keyword || "상대 팀 진행 중..."}
              </p>
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
