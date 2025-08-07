// src/pages/SilentScreamPage.jsx

import LiveKitVideo from "../components/organisms/common/LiveKitVideo.jsx";
import connectLiveKit from "../utils/connectLiveKit";

import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";

import backgroundSilentScream from "../assets/background/background_silentscream.gif"
import RoundInfo from "../components/molecules/games/RoundInfo";
import ChatBox from "../components/molecules/common/ChatBox";
import PopUpModal from "../components/atoms/modal/PopUpModal";
import KeywordModal from "../components/atoms/modal/KeywordModal";
import SubmitModal from "../components/molecules/games/SubmitModal";
import PassButton from "../components/atoms/button/PassButton.jsx"
import RightButton from "../components/atoms/button/RightButton.jsx"
import Timer from "../components/molecules/games/Timer";
import KeywordCard from "../components/atoms/modal/KeywordCard";

import useAuthStore from "../store/useAuthStore.js";
import useGameStore from '../store/useGameStore'
import { emitGamePass, emitAnswerSubmit, emitTurnOver, emitRoundOver, emitTimerStart } from "../sockets/game/emit.js";

const SilentScreamPage = () => {
  const navigate = useNavigate();

  // 방 정보 선언
  const master = useGameStore((state)=> state.master)
  const {user} = useAuthStore();
  const myIdx = user?.userAccountId;

  const roomInstance = useGameStore((state) => state.roomInstance);
  const participants = useGameStore((state) => state.participants);

  const roomId = useGameStore((state) => state.roomId);
  const roomInfo = useGameStore((state) => state.roomInfo);

  // 상태 관리 (전역)
  // 턴,라운드
  const turn = useGameStore((state) => state.turn);
  const round = useGameStore((state) => state.round);

  // 팀 추출
  const myParticipant = participants.find(p => p.userAccountId === myIdx);
  const myTeam = myParticipant?.team || null;
  
  // 타이머 
  const time = useGameStore((state) => state.time);
  const isTimerEnd = useGameStore((state) => state.isTimerEnd);
  const resetGameTimerEnd = useGameStore((state) => state.resetIsTimerEnd);

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

  // 최종 승자
  const win = useGameStore((state) => state.win);
  // 모달
  const isGameStartModalOpen = useGameStore((state) => state.isGamestartModalOpen);
  const isTurnModalOpen = useGameStore((state) => state.isTurnModalOpen);
  const closeGameStartModal = useGameStore((state) => state.closeGamestartModal);
  const closeTurnModal = useGameStore((state) => state.closeTurnModal);
  const showTurnChangeModal = useGameStore((state) => state.showTurnChangeModal); // 턴 바뀔때 모달 

  // 첫 시작 모달
  const handleTimerPrepareSequence = useGameStore((state) => state.handleTimerPrepareSequence);

  // 상태 관리 (로컬)
  const [keyword, setKeyword] = useState("");
  const [isTimerOpen, setIsTimerOpen] = useState(true);

  // 모달 상태 관리
  const [isKeywordModalOpen, setIsKeywordModalOpen] = useState(false);
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);
  const [isWinModalOpen, setIsWinModalOpen] = useState(false);
  const [hasSubmitted, setHasSubmitted] = useState(false);
 
  // 추가 상태
  const [isFirstLoad, setIsFirstLoad] = useState(true);


  // 1️. 첫 페이지 로딩
  useEffect(() => {
    console.log("keywordIdx",keywordIdx)
    handleTimerPrepareSequence(roomId);
  }, [roomId]);

  // 턴 바뀔 때 턴 모달 띄움 
  useEffect(() => {
    // 첫 로딩(게임 시작) 제외
    if (!isFirstLoad) {
      showTurnChangeModal();
    } else {
      setIsFirstLoad(false);
    }
  }, [turn]);

  // 제출자가 아닐 경우 keywordIdx가 변경되면 제시어 카드 띄우기
  useEffect(() => {
    if ((!norIdxList?.includes(myIdx)) && keywordList.length > 0) {
      setKeyword(keywordList[keywordIdx]);
    }
  }, [keywordIdx, keywordList, norIdxList]);

  // turn 변환 (레드팀 -> 블루팀), 라운드 변환 (블루 -> 레드)
  useEffect(() => {
      if (keywordIdx >= 15) 
        if (myIdx === master){
          if (turn === "RED")
          {
            emitTurnOver({ roomId,team:turn,score:score });
            if(round <=3){
              emitTimerStart({ roomId });
            }

          } 
          else if (turn === "BLUE" )
          {
            emitRoundOver({ roomId,team:turn,score:score });
            if(round <=2){
              emitTimerStart({ roomId });
            }
          }
        }
      // 추가 조건 : 타이머 끝났을 때 
      if (isTimerEnd){  
        if (myIdx === master){
        
          if (turn === "RED"){
            emitTurnOver({ roomId,team:turn,score:score });
            resetGameTimerEnd();
            if(round <=3){
              emitTimerStart({ roomId });
            }
          }
          else if (turn === "BLUE"){
            emitRoundOver({ roomId,team:turn,score:score });
            resetGameTimerEnd();

            if(round <=2){
              emitTimerStart({ roomId });
            }
          }
        
      }
      }
  }, [keywordIdx,isTimerEnd]);
  
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

  // Enter 키로 제출 모달 열기
  useEffect(() => {
    const handleEnterKey = (e) => {
      if (e.key === "Enter") {
        if (norIdxList.includes(myIdx) && !isSubmitModalOpen && !hasSubmitted) {
          setIsSubmitModalOpen(true);
          setHasSubmitted(true); // ✅ 한번 연 뒤에는 다시 안 열리게
        }
      }
    };
    window.addEventListener("keydown", handleEnterKey);
    return () => {
      window.removeEventListener("keydown", handleEnterKey);
    };
  }, [myIdx, norIdxList, isSubmitModalOpen, hasSubmitted]);
  
  // 턴이 바뀌거나 keywordIdx 바뀌면 리셋
  useEffect(() => {
    setHasSubmitted(false);
  }, [round, keywordIdx]); // 상황에 따라 round 또는 keywordIdx 사용

  // Livekit 연결
  useEffect(() => {
    if (!user || !roomId || roomInstance || participants.length > 0) return;
    console.log("🚀 LiveKit 연결 시작")

    connectLiveKit(user);
  }, [user, roomId]);

  // 역할 부여
  useEffect(() => {
    // 내가 받지 못한 유저일 경우 역할 수동 부여
    const hasRole = participants.some((p) => p.role);
    const hasEnoughData = repIdxList.length > 0 && norIdxList.length > 0;
  
    if (!hasRole && hasEnoughData) {
      useGameStore.getState().setGameRoles({ repIdxList, norIdxList });
      console.log("🛠 역할 수동 설정 완료: SilentScreamPage fallback");
    }
  }, [repIdxList, norIdxList, participants]);

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
      position: "top-20 left-5",
      size: "w-160 h-125 rounded-lg shadow-lg",
    },
  ];
  const norStyles = [
    {
      position: "top-20 left-170",
      size: "w-80 h-60 rounded-lg shadow-lg",
    },
    {
      position: "top-85 left-170",
      size: "w-80 h-60 rounded-lg shadow-lg",
    },
  ];
  const enemyStyles = [
    {
      position: "bottom-6 right-142",
      size: "w-65 h-50 rounded-lg shadow-lg",
    },
    {
      position: "bottom-6 right-72",
      size: "w-65 h-50 rounded-lg shadow-lg",
    },
    {
      position: "bottom-6 right-2",
      size: "w-65 h-50 rounded-lg shadow-lg",
    },
  ];

  // 분류 후 자동 배치
  const enemyTeam = turn === "RED" ? "BLUE" : "RED"; // 반대 팀 계산
  const repGroup = participants.filter((p) => p.role === "REP");
  const norGroup = participants.filter((p) => p.role === "NOR");
  const enemyGroup = participants.filter((p) => p.role === null && p.team === enemyTeam);

  // participants 확인
  useEffect(() => {
    // console.log("🔍 전체 participants 확인", participants);
    participants.forEach((p) => {
    // console.log(`[${p.identity}] userId: ${p.userAccountId}, role: ${p.role}, team: ${p.team}`);
    });
  }, [participants]);  
  
 
  // 최종 누가 이겼는지
  useEffect(() => {
    console.log(win);
    console.log(isWinModalOpen);
    if (win) {
      
      setIsWinModalOpen(true);
      const timeout = setTimeout(() => {
        // 게임 종료 후 대기방 복귀 - 정상 입장 플래그 설정
        sessionStorage.setItem('waitingPageNormalEntry', 'true');
        navigate(`/waiting/${roomId}`, { state: { room: roomInfo } });
      }, 7000);

      return () => clearTimeout(timeout);
    }
  }, [win]);

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
        <div className="absolute top-6 left-1/2 -translate-x-1/2 text-3xl font-bold">
          <span className={turn === "RED" ? "text-red-500" : "text-blue-500"}>
            {turn} TEAM
          </span>{" "}
          TURN
        </div>

        {/* 현재팀 캠 */}
        <div className="relative w-full h-[250px]">
          {/* user1 (Rep) - 왼쪽 크게 */}
          {renderVideoByRole(repGroup, repStyles)}
          {renderVideoByRole(norGroup, norStyles)}
        </div> 

        {/* 상대팀 캠 */}
        <div className="relative w-full h-[180px] mt-auto">
          {/* 상대팀 턴 */}
          <div className="absolute bottom-60 right-6 text-2xl font-bold">
          <span className={enemyTeam === "RED" ? "text-red-500" : "text-blue-500"}>
            {enemyTeam} TEAM
          </span>
        </div>

          {renderVideoByRole(enemyGroup, enemyStyles)}
        </div>
          
        {/* 타이머 */}
        {isTimerOpen && (
          <div className="absolute top-18 right-68 z-20 scale-150">
            <Timer seconds={time} />
          </div>
        )}
        
        {/* RoundInfo (우측 상단 고정) */}
        <div className="absolute top-16 right-12 z-20 scale-150">

          <RoundInfo
            round={round}
            redScore={teamScore?.RED}
            blueScore={teamScore?.BLUE}
          />

        </div>

        {/* Keyword 카드 (발화자 + 상대팀 보임) */}
        {!norIdxList.includes(myIdx) && (
          <div className="absolute top-32 right-42 z-20">
            <KeywordCard keyword={keywordList[keywordIdx]} />
          </div>
        )}
        
        <div className="absolute top-80 right-40 z-20 flex flex-col items-center">
          {/* 발화자용 PASS 버튼 */}
          {repIdxList.includes(myIdx) && (
            <PassButton onClick={() => emitGamePass({ roomId })} />
          )}

          {/* 정답 제출 버튼 */}
          {norIdxList.includes(myIdx) && (

            <RightButton
              children="제출"
              onClick={() => {
                if (!isSubmitModalOpen) {
                  setIsSubmitModalOpen(true);
                }
              }}
            />
          )}

          {/* 🔽 모든 유저에게 보이는 진행도 */}
          <div className="mt-2 px-3 py-1 bg-white border-2 border-black rounded shadow-md text-black text-lg font-bold text-center w-[100px]">
            {Math.min((keywordIdx ?? 0) + 1, 15)} / 15
          </div>
        </div>
        

        {/* ChatBox (우측 하단 고정) */}
        <div className="absolute bottom-6 left-15 z-20 opacity-80">
          <ChatBox
            width="500px"
            height="250px"
            roomId={roomId}
            team={myTeam}
          />
        </div>

      </div>

       {/* GAME START 모달 */}
      <PopUpModal 
        isOpen={isGameStartModalOpen} 
        onClose={() => closeGameStartModal()}
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

       {/* KEYWORD 모달
      <KeywordModal 
        isOpen={isKeywordModalOpen} 
        onClose={() => setIsKeywordModalOpen(false)}
        children={keyword}
      >
      </KeywordModal> */}

      {/* 턴 모달 */}
      <PopUpModal 
        isOpen={isTurnModalOpen} 
        onClose={() => closeTurnModal()}
      >
        <p className="text-6xl font-bold font-pixel">{turn === "RED" ? "RED TEAM TURN" : "BLUE TEAM TURN"}</p>
      </PopUpModal>

      {/* 최종 승자 모달 */}
      <PopUpModal 
        isOpen={isWinModalOpen} 
        onClose={() => setIsWinModalOpen(false)}
      >
       <p className="text-6xl font-bold font-pixel">{win === "DRAW" && "DRAW!" || win === "RED" && "RED TEAM WIN!" || win === "BLUE" && "BLUE TEAM WIN!"}</p>
      </PopUpModal>
    </div>

  );
}

export default SilentScreamPage;