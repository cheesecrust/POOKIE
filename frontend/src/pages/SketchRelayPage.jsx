import background_sketchrelay from "../assets/background/background_sketchrelay.gif";
import RoundInfo from "../components/molecules/games/RoundInfo";
import ChatBox from "../components/molecules/common/ChatBox";

import { useEffect } from "react";
import { connectSocket } from "../sockets/common/websocket";
import {
  emitGameStart,
  emitTurnChange,
  emitRoundOver,
} from "../sockets/games/sketchRelay/emit";

const SketchRelayPage = () => {
  useEffect(() => {
    const token = import.meta.env.VITE_WS_TOKEN;

    connectSocket({
      url: "wss://i13a604.p.ssafy.io/api/game",
      token: token,
      onMessage: (e) => {
        try {
          // 그대로 출력
          console.log("[WebSocket MESSAGE]", e);
      
          // e 가 바로 객체로 전달돼서 parsing 할 필요가 없음
          const data = e.data;
      
          console.log("[WebSocket DATA]", data);
      
          // 예시: 메시지 타입 분기
          if (data.type === "ON") {
            console.log("유저 연결됨:", data.user.userId);
          }
      
        } catch (err) {
          console.error("[WebSocket MESSAGE PARSE ERROR]", err);
        }
      },
      
      onOpen: (e) => {
        console.log("[WebSocket OPEN]", e);
      },
      onClose: (e) => {
        console.log("[WebSocket CLOSE]", e);
      },
      onError: (e) => {
        console.log("[WebSocket ERROR]", e);
      },
    });
  }, []);


  return (
<div className="relative w-full h-screen overflow-hidden">
  {/* 배경 이미지는 absolute로 완전 뒤로 보내야 함 */}
  <img
    src={background_sketchrelay}
    alt="background_sketchrelay"
    className="absolute top-0 left-0 w-full h-full object-cover -z-10"
  />

  {/*  모든 컨텐츠는 여기서 relative 위치로 올라감 */}
  <div className="relative z-10 w-full h-full flex flex-col justify-between items-center py-12 px-10">
    
    {/*  레드팀 캠 */}
    <div className="flex gap-19 justify-center">
      {[...Array(3)].map((_, i) => (
        <div key={i} className="w-50 h-32 bg-white rounded-lg shadow-lg" />
      ))}
    </div>

    {/*  칠판 자리 canvas Api */}
    <div className="w-[1200px] h-[600px] bg-white rounded-lg border-4 border-gray-300 shadow-inner my-6" />

    {/* 블루팀 캠 */}
    <div className="flex gap-19 justify-center">
      {[...Array(3)].map((_, i) => (
        <div key={i} className="w-50 h-32 bg-white rounded-lg shadow-lg" />
      ))}
    </div>
  </div>

  {/* RoundInfo (우측 상단 고정) */}
  <div className="absolute top-4 right-4 z-20">
    <RoundInfo round={1} redScore={0} blueScore={0} />
  </div>

  {/* ChatBox (우측 하단 고정) */}
  <div className="absolute bottom-4 left-0 z-20">
    <div className="relative w-[300px] h-[300px] "> 
      <div className="absolute bottom-0 left-0 ">  
        <ChatBox width="300px" height="300px"/>          
      </div>
    </div>
  </div>
  {/* 테스트용 emit 버튼 */}
  <div className="absolute top-4 left-4 z-20 flex flex-col gap-2">
    <button onClick={() =>{console.log("emitCreateRoom"); emitCreateRoom();} } className="bg-green-300 px-4 py-2 rounded">CREATE_ROOM</button>
    <button onClick={() =>{console.log("emitGameStart"); emitGameStart();} } className="bg-green-300 px-4 py-2 rounded">GAME_START</button>
    <button onClick={() =>{console.log("emitTurnChange"); emitTurnChange();} } className="bg-blue-300 px-4 py-2 rounded">TURN_CHANGE</button>
    <button onClick={() =>{console.log("emitRoundOver"); emitRoundOver();} } className="bg-red-300 px-4 py-2 rounded">ROUND_OVER</button>
  </div>
  </div>
  );
};

export default SketchRelayPage;
