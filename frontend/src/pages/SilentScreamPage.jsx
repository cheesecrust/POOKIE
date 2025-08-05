// src/pages/SilentScreamPage.jsx

import LiveKitVideo from "../components/organisms/common/LiveKitVideo.jsx";
import { Room, RoomEvent, createLocalVideoTrack } from "livekit-client";

import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import backgroundSilentScream from "../assets/background/background_silentscream.gif"
import RoundInfo from "../components/molecules/games/RoundInfo";
import ChatBox from "../components/molecules/common/ChatBox";
import PopUpModal from "../components/atoms/modal/PopUpModal";
import KeywordModal from "../components/atoms/modal/KeywordModal";
import SubmitModal from "../components/molecules/games/SubmitModal";
import PassButton from "../components/atoms/button/PassButton.jsx"
import RightButton from "../components/atoms/button/RightButton.jsx"

import useAuthStore from "../store/useAuthStore.js";
import useGameStore from '../store/useGameStore'
import { emitGamePass, emitAnswerSubmit, emitTurnOver, emitRoundOver } from "../sockets/game/emit.js";

const SilentScreamPage = () => {

  // 방 정보 선언
  const master = useGameStore((state)=> state.master)
  const {user} = useAuthStore();
  const myIdx = user?.userAccountId;
  const { roomId } = useParams();
  const roomInstance = useGameStore((state) => state.roomInstance);
  const redTeam = useGameStore((state) => state.redTeam);
  const blueTeam = useGameStore((state) => state.blueTeam);
  const publisherTrack = useGameStore((state) => state.publisherTrack);
  const participants = useGameStore((state) => state.participants);


  // 상태 관리 (전역)
  // 턴,라운드
  const turn = useGameStore((state) => state.turn);
  const round = useGameStore((state) => state.round);
  
  //타이머 
  const turnTimeLeft = useGameStore((state) => state.turnTimeLeft);
  const timeLeft = useGameStore((state) => state.timeLeft);

  // 맞히는 사람(제시어 x)
  const norIdxList = useGameStore((state) => state.norIdxList);
  
  // 발화자(제시어 가짐)
  const repIdx = useGameStore((state) => state.repIdx);
  const repIdxList = useGameStore((state) => state.repIdxList);

  //키워드 
  const keywordList = useGameStore((state) => state.keywordList);
  const keywordIdx = useGameStore((state) => state.keywordIdx);

  // 점수 관련
  const teamScore = useGameStore((state) => state.teamScore);
  const tempTeamScore = useGameStore((state) => state.tempTeamScore);
  const roundResult = useGameStore((state) => state.roundResult);
  const gameResult = useGameStore((state) => state.gameResult);
  const score = useGameStore((state) => state.score); // 현재라운드 현재 팀 점수 

  // 상태 관리 (로컬)
  const [keyword, setKeyword] = useState("");

  // 모달 상태 관리
  const [isTurnModalOpen, setIsTurnModalOpen] = useState(false);
  const [isKeywordModalOpen, setIsKeywordModalOpen] = useState(false);
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);
  const [isGamestartModalOpen, setIsGamestartModalOpen] = useState(false);

  // 추가 상태
  const [isFirstLoad, setIsFirstLoad] = useState(true);

  // const {roomId} = useParams();
  // const setRoomId = useGameStore((state) => state.setRoomId);
  // useEffect(()=> {
  //   if (!roomId) return;
  //   setRoomId(roomId); 
  //   }, [roomId,setRoomId]);



  // 1️ 첫 페이지 로딩
  useEffect(() => {
    setIsGamestartModalOpen(true);

    const timer1 = setTimeout(() => {
      setIsGamestartModalOpen(false);
      setIsTurnModalOpen(true);

      const timer2 = setTimeout(() => {
        setIsTurnModalOpen(false);
        setIsFirstLoad(false); // 첫 진입 끝남
      }, 3000);

      return () => clearTimeout(timer2);
    }, 3000);

    return () => clearTimeout(timer1);
  }, []);

  // 턴 바뀔 때
  useEffect(() => {
    if (!isFirstLoad && !isGamestartModalOpen) {
      setIsTurnModalOpen(true);
      const timer = setTimeout(() => {
        setIsTurnModalOpen(false);
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [turn]);

    // repIdxList와 내 id가 매칭되고 keywordIdx가 변경되면 제시어 모달 띄우기
  useEffect(() => {
    if (repIdxList?.includes(myIdx) && keywordList.length > 0) {
      setKeyword(keywordList[keywordIdx] || "");
      setIsKeywordModalOpen(true);
    }
  }, [keywordIdx]);

  // turn 변환 (레드팀 -> 블루팀), 라운드 변환환
  useEffect(() => {
    if (myIdx === master && keywordIdx >= 15) 
      if (turn === "RED")
      {
      emitTurnOver({ roomId,team:turn,score:score });
    } 
    else if (turn === "BLUE")
    {
      emitRoundOver({ roomId,team:turn,score:score });
    }
  }, [keywordIdx]);
  
  // esc 키 눌렀을 때 제출 모달 닫기
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        setIsSubmitModalOpen(false);
      }
    };
  
    if (isSubmitModalOpen) {
      window.addEventListener("keydown", handleKeyDown);
    }
  
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isSubmitModalOpen]);
 
  // livekit 관련
  async function getToken(roomId, participantName) {
    if (!accessToken) throw new Error("로그인 필요. accessToken 없음");
    const apiUrl = import.meta.env.VITE_API_URL;
    const res = await fetch(`${apiUrl}/rtc/token`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ room: roomId, name: participantName, team: "red" }),
    });
    if (!res.ok) throw new Error("open vidu 토큰 요청 실패");
    const tokenObj = await res.json();
    return tokenObj.token;
  }

  // livekit 렌더 함수
  const renderVideoByRole = (roleGroup, positionStyles) => {
    return roleGroup.map((p, idx) => {
      return (
        <div
          key={p.identity}
          className={`absolute ${positionStyles[idx]?.position}`}
        >
          <LiveKitVideo
            videoTrack={p.track}
            nickname={p.nickname}
            isLocal={p.isLocal}
            containerClassName={positionStyles[idx]?.size}
            nicknameClassName="absolute bottom-4 left-4 text-white text-2xl"
          />
        </div>
      );
    });
  };  

  // 위치/크기 정의
  const repStyles = [
    {
      position: "top-10 left-5",
      size: "w-180 h-125 rounded-lg shadow-lg",
    },
  ];
  const norStyles = [
    {
      position: "top-10 left-195",
      size: "w-90 h-60 rounded-lg shadow-lg",
    },
    {
      position: "top-75 left-195",
      size: "w-90 h-60 rounded-lg shadow-lg",
    },
  ];
  const enemyStyles = [
    {
      position: "bottom-6 right-220",
      size: "w-85 h-60 rounded-lg shadow-lg",
    },
    {
      position: "bottom-6 right-120",
      size: "w-85 h-60 rounded-lg shadow-lg",
    },
    {
      position: "bottom-6 right-20",
      size: "w-85 h-60 rounded-lg shadow-lg",
    },
  ];

  // 분류 후 자동 배치
  const repGroup = participants.filter((p) => p.role === "REP");
  const norGroup = participants.filter((p) => p.role === "NOR");
  const enemyGroup = participants.filter((p) => p.role === null);
  
  return (
    <div className="relative w-full h-screen overflow-hidden">
      {/* 배경 이미지는 absolute로 완전 뒤로 보내야 함 */}
      <img
        src={backgroundSilentScream}
        alt="background_silentScream"
        className="absolute top-0 left-0 w-full h-full object-cover -z-10"
      />

      {/*  모든 컨텐츠는 여기서 relative 위치로 올라감 */}
      <div className="relative z-10 w-full h-full flex flex-col items-center px-10">
        {/* 현재 팀 턴 */}
        <div className="text-center text-3xl font-bold">
          {turn === "RED" ? "RED TEAM TURN" : "BLUE TEAM TURN"}
        </div>

        {/* 현재팀 캠 */}
        <div className="relative w-full h-[250px]">
          {/* user1 (Rep) - 왼쪽 크게 */}
          {renderVideoByRole(repGroup, repStyles)}
          {renderVideoByRole(norGroup, norStyles)}
        </div>


        {/* 상대팀 캠 */}
        <div className="relative w-full h-[180px] mt-auto">
          <div className="absolute bottom-70 right-12 text-2xl font-bold">
            {turn === "RED" ? "BLUE TEAM" : "RED TEAM"}
          </div>
          {renderVideoByRole(enemyGroup, enemyStyles)}
        </div>
          
        {/* RoundInfo (우측 상단 고정) */}
        <div className="absolute top-12 right-8 z-20 scale-150">
          <RoundInfo
            round={round}
            redScore={teamScore?.red}
            blueScore={teamScore?.blue}
          />
        </div>
        
        <div className="absolute top-80 right-40 z-20 flex flex-col items-center">
          {/* 발화자용 PASS 버튼 */}
          {repIdxList.includes(myIdx) && (
            <PassButton onClick={() => emitGamePass({ roomId })} />
          )}

          {/* 정답 제출 버튼 */}
          {norIdxList.includes(myIdx) && (
            console.log("✅ 제출 버튼 클릭됨"),
            <RightButton children="제출" onClick={() => setIsSubmitModalOpen(true)} />
          )}

          {/* 🔽 모든 유저에게 보이는 진행도 */}
          <div className="mt-2 px-3 py-1 bg-white border-2 border-black rounded shadow-md text-black text-lg font-bold text-center w-[100px]">
            {Math.min((keywordIdx ?? 0) + 1, 15)} / 15
          </div>
        </div>
        

        {/* ChatBox (우측 하단 고정) */}
        <div className="absolute bottom-4 left-15 z-20 opacity-80">
          <ChatBox width="550px" height="400px" />
        </div>

      </div>

       {/* GAME START 모달 */}
      <PopUpModal 
        isOpen={isGamestartModalOpen} 
        onClose={() => setIsGamestartModalOpen(false)}
      >
        <p className="text-6xl font-bold font-pixel">GAME START</p>
      </PopUpModal>
      
      {/* 제시어 제출 모달 */}
      {isSubmitModalOpen && (
      <SubmitModal 
        isOpen={isSubmitModalOpen}
        onClose={() => setIsSubmitModalOpen(false)}
        onSubmit={(inputAnswer) => {
          emitAnswerSubmit({roomId, round, norId:myIdx, keywordIdx, inputAnswer});
          setIsSubmitModalOpen(false);
        }}
      />
    )}

      {/*  KEYWORD 모달 */}
      <KeywordModal 
        isOpen={isKeywordModalOpen} 
        onClose={() => setIsKeywordModalOpen(false)}
        children={keyword}
      >
      </KeywordModal>

      {/* 턴 모달 */}
      <PopUpModal 
        isOpen={isTurnModalOpen} 
        onClose={() => setIsTurnModalOpen(false)}
      >
        <p className="text-6xl font-bold font-pixel">{turn === "RED" ? "RED TEAM TURN" : "BLUE TEAM TURN"}</p>
      </PopUpModal>
    </div>

  );
}

export default SilentScreamPage;