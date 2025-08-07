// src/pages/SketchRelayPage.jsx

import LiveKitVideo from "../components/organisms/common/LiveKitVideo.jsx";
import { useEffect, useState, useRef, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";

import backgroundSketchRelay from "../assets/background/background_sketchrelay.gif";
import RoundInfo from "../components/molecules/games/RoundInfo";
import ChatBox from "../components/molecules/common/ChatBox";
import PopUpModal from "../components/atoms/modal/PopUpModal";
import KeywordModal from "../components/atoms/modal/KeywordModal";
import SubmitModal from "../components/molecules/games/SubmitModal";
import RightButton from "../components/atoms/button/RightButton.jsx";
import Timer from "../components/molecules/games/Timer";
import GameResultModal from "../components/organisms/games/GameResultModal";

import useAuthStore from "../store/useAuthStore.js";
import useGameStore from '../store/useGameStore';
import { 
  emitAnswerSubmit, 
  emitTurnOver, 
  emitRoundOver, 
  emitTimerStart, 
  emitDrawEvent,
  emitPainterChange 
} from "../sockets/game/emit.js";
import { updateHandlers } from "../sockets/websocket";

const SketchRelayPage = () => {
  const navigate = useNavigate();
  const { roomId } = useParams();

  // 방 정보 선언
  const master = useGameStore((state) => state.master);
  const { user } = useAuthStore();
  const myIdx = user?.userAccountId;

  const roomInstance = useGameStore((state) => state.roomInstance);
  const participants = useGameStore((state) => state.participants);

  const roomInfo = useGameStore((state) => state.roomInfo);

  // 상태 관리 (전역)
  // 턴, 라운드
  const turn = useGameStore((state) => state.turn);
  const round = useGameStore((state) => state.round);

  // 타이머 
  const time = useGameStore((state) => state.time);
  const isTimerEnd = useGameStore((state) => state.isTimerEnd);
  const resetGameTimerEnd = useGameStore((state) => state.resetIsTimerEnd);

  // 맞히는 사람(제시어 x)
  const norIdxList = useGameStore((state) => state.norIdxList);

  // 그리는 사람(제시어 가짐)
  const repIdx = useGameStore((state) => state.repIdx);
  const repIdxList = useGameStore((state) => state.repIdxList);
  
  // 그림그리기 게임용 상태
  const currentDrawTurn = useGameStore((state) => state.currentDrawTurn);
  const maxDrawTurnsPerTeam = useGameStore((state) => state.maxDrawTurnsPerTeam);

  // 키워드 
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
  
  // 팀 정보
  const red = useGameStore((state) => state.red) || [];
  const blue = useGameStore((state) => state.blue) || [];
  
  // 팀 데이터가 없으면 participants에서 추출
  const redTeamFallback = red.length > 0 ? red : participants.filter(p => p.team === "RED");
  const blueTeamFallback = blue.length > 0 ? blue : participants.filter(p => p.team === "BLUE");

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

  // 추가 상태
  const [isFirstLoad, setIsFirstLoad] = useState(true);

  // Canvas 관련 상태
  const canvasRef = useRef(null);
  const ctxRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [isErasing, setIsErasing] = useState(false);
  const lastPointRef = useRef({ x: 0, y: 0 });

  // 사용자 역할 상태
  const [userRole, setUserRole] = useState(null); // 'drawer', 'guesser', 'spectator'
  const [isMyTurn, setIsMyTurn] = useState(false);

  // 1️⃣ 첫 페이지 로딩
  useEffect(() => {
    if (roomId) {
      handleTimerPrepareSequence(roomId);
    }
  }, [roomId, handleTimerPrepareSequence]);

  // 2️⃣ roomId를 useGameStore에 설정
  useEffect(() => {
    if (roomId) {
      useGameStore.getState().setRoomId(roomId);
    }
  }, [roomId]);

  // 3️⃣ 턴 바뀔 때 턴 모달 띄움 
  useEffect(() => {
    // 첫 로딩(게임 시작) 제외
    if (!isFirstLoad) {
      showTurnChangeModal();
    }
  }, [turn, showTurnChangeModal]);

  // 4️⃣ 키워드 업데이트
  useEffect(() => {
    if (keywordList?.length > 0 && keywordIdx !== undefined) {
      setKeyword(keywordList[keywordIdx] || "");
    }
  }, [keywordList, keywordIdx]);

  // 5️⃣ 사용자 역할 결정
  useEffect(() => {
    if (!myIdx || !repIdxList?.length || !norIdxList?.length) {
      console.log("역할 결정 조건 미충족:", { myIdx, repIdxList, norIdxList });
      return;
    }

    console.log("역할 결정 중:", { myIdx, repIdxList, norIdxList, turn });

    // 내가 어느 팀인지 확인
    const myParticipant = participants.find(p => p.userAccountId === myIdx);
    const myTeam = myParticipant?.team;
    
    console.log("내 정보:", { myParticipant, myTeam });

    if (repIdxList.includes(myIdx)) {
      setUserRole('drawer');
      // 현재 그리는 사람인지 확인 (내 팀 턴일 때만)
      const currentRepIdx = repIdx || 0;
      const currentDrawerAccountId = repIdxList[currentRepIdx];
      const isMyTeamTurn = turn === myTeam;
      setIsMyTurn(isMyTeamTurn && currentDrawerAccountId === myIdx);
      console.log("그리는 역할 부여:", { currentRepIdx, currentDrawerAccountId, isMyTeamTurn, isMyTurn: isMyTeamTurn && currentDrawerAccountId === myIdx });
    } else if (norIdxList.includes(myIdx)) {
      setUserRole('guesser');
      setIsMyTurn(false);
      console.log("맞추는 역할 부여");
    } else {
      setUserRole('spectator');
      setIsMyTurn(false);
      console.log("관전자 역할 부여");
    }
  }, [myIdx, repIdxList, norIdxList, repIdx, turn, participants]);

  // 6️⃣ 첫 로딩 상태 관리
  useEffect(() => {
    if (turn && isFirstLoad) {
      setIsFirstLoad(false);
    }
  }, [turn, isFirstLoad]);

  // 7️⃣ 타이머 종료 처리 (그림그리기 전용)
  useEffect(() => {
    if (isTimerEnd && myIdx === master) {
      console.log("🔔 타이머 종료, 다음 턴 준비");
      
      // 다음 그리기 턴으로 이동
      const result = useGameStore.getState().nextDrawTurn();
      
      // 캔버스 초기화
      const canvas = canvasRef.current;
      const ctx = ctxRef.current;
      if (canvas && ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
      
      if (result?.roundComplete) {
        // 라운드 완료 - 기존 라운드 오버 로직 사용
        console.log("🏁 10턴 완료, 라운드 종료");
        emitRoundOver({
          roomId,
          team: turn,
          score: score || 0
        });
      } else {
        // 다음 타이머 자동 시작
        useGameStore.getState().autoStartNextTimer(roomId);
      }
      
      resetGameTimerEnd();
    }
  }, [isTimerEnd, myIdx, master, roomId, turn, score, resetGameTimerEnd]);

  // 8️⃣ 최종 승자 처리
  useEffect(() => {
    if (win) {
      setIsWinModalOpen(true);
      const timeout = setTimeout(() => {
        sessionStorage.setItem('waitingPageNormalEntry', 'true');
        navigate(`/waiting/${roomId}`, { state: { room: roomInfo } });
      }, 7000);

      return () => clearTimeout(timeout);
    }
  }, [win, navigate, roomId, roomInfo]);

  // Canvas 초기화
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width;
    canvas.height = rect.height;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.strokeStyle = "black";
    ctx.lineWidth = 3;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    ctxRef.current = ctx;

    return () => {
      if (ctx) {
        ctx.closePath();
      }
    };
  }, []);

  // Canvas 그리기 함수들
  const getCoordinates = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return { offsetX: 0, offsetY: 0 };

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    return {
      offsetX: (e.clientX - rect.left) * scaleX,
      offsetY: (e.clientY - rect.top) * scaleY,
    };
  };

  const setDrawingStyle = useCallback((ctx) => {
    if (isErasing) {
      ctx.lineWidth = 25;
      ctx.globalCompositeOperation = "destination-out";
    } else {
      ctx.lineWidth = 3;
      ctx.globalCompositeOperation = "source-over";
      ctx.strokeStyle = "black";
    }
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
  }, [isErasing]);

  const startDrawing = useCallback((e) => {
    if (userRole !== 'drawer' || !isMyTurn) return;
    
    const ctx = ctxRef.current;
    if (!ctx) return;

    const { offsetX, offsetY } = getCoordinates(e);

    ctx.beginPath();
    ctx.moveTo(offsetX, offsetY);
    setDrawingStyle(ctx);
    setIsDrawing(true);

    lastPointRef.current = { x: offsetX, y: offsetY };

    emitDrawEvent({
      roomId,
      drawType: "start",
      data: {
        x: offsetX,
        y: offsetY,
        prevX: offsetX,
        prevY: offsetY,
        tool: isErasing ? "eraser" : "pen",
        brushSize: isErasing ? 25 : 3,
        color: "black"
      }
    });
  }, [roomId, isErasing, userRole, isMyTurn, setDrawingStyle]);

  const draw = useCallback((e) => {
    if (!isDrawing || !ctxRef.current || userRole !== 'drawer' || !isMyTurn) return;

    const { offsetX, offsetY } = getCoordinates(e);
    const ctx = ctxRef.current;

    ctx.lineTo(offsetX, offsetY);
    ctx.stroke();

    emitDrawEvent({
      roomId,
      drawType: "draw",
      data: {
        x: offsetX,
        y: offsetY,
        prevX: lastPointRef.current.x,
        prevY: lastPointRef.current.y,
        tool: isErasing ? "eraser" : "pen",
        brushSize: isErasing ? 25 : 3,
        color: "black"
      }
    });

    ctx.beginPath();
    ctx.moveTo(offsetX, offsetY);
    setDrawingStyle(ctx);

    lastPointRef.current = { x: offsetX, y: offsetY };
  }, [isDrawing, setDrawingStyle, roomId, isErasing, userRole, isMyTurn]);

  const stopDrawing = useCallback(() => {
    if (!isDrawing) return;
    
    const ctx = ctxRef.current;
    if (ctx) {
      ctx.closePath();
    }
    setIsDrawing(false);

    emitDrawEvent({
      roomId,
      drawType: "end",
      data: {}
    });
  }, [isDrawing, roomId]);

  const clearCanvas = () => {
    if (userRole !== 'drawer' || !isMyTurn) return;
    
    const canvas = canvasRef.current;
    const ctx = ctxRef.current;
    if (!canvas || !ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    emitDrawEvent({
      roomId,
      drawType: "clear",
      data: {}
    });
  };

  const handlePainterChange = () => {
    if (userRole !== 'drawer' || !isMyTurn) return;
    emitPainterChange({
      roomId,
      curRepIdx: repIdx
    });
  };

  const togglePen = () => setIsErasing(false);
  const toggleEraser = () => setIsErasing(true);

  // 다른 사용자의 그리기 이벤트 처리
  const handleRemoteDrawEvent = useCallback((eventData) => {
    const ctx = ctxRef.current;
    if (!ctx) return;

    const { drawType, data } = eventData;

    switch (drawType) {
      case "clear":
        ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
        break;
      
      case "start":
        ctx.beginPath();
        ctx.moveTo(data.x, data.y);
        if (data.tool === "eraser") {
          ctx.lineWidth = data.brushSize;
          ctx.globalCompositeOperation = "destination-out";
        } else {
          ctx.lineWidth = data.brushSize;
          ctx.globalCompositeOperation = "source-over";
          ctx.strokeStyle = data.color;
        }
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
        break;
      
      case "draw":
        ctx.lineTo(data.x, data.y);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(data.x, data.y);
        break;
      
      case "end":
        ctx.closePath();
        break;
    }
  }, []);

  // WebSocket 핸들러 등록
  useEffect(() => {
    updateHandlers({
      onDrawEvent: handleRemoteDrawEvent
    });

    return () => {
      updateHandlers({
        onDrawEvent: null
      });
    };
  }, [handleRemoteDrawEvent]);

  // Video 렌더링 함수
  const renderVideoByRole = (group, styles) => {
    return group.map((participant, index) => {
      const style = styles[index];
      if (!style) return null;

      return (
        <div key={participant.identity} className={`absolute ${style.position}`}>
          <div className={`${style.size} overflow-hidden`}>
            <LiveKitVideo
              participant={participant}
              isLocal={participant.identity === user?.id}
              audioEnabled={false}
              videoEnabled={true}
            />
            <div className="absolute bottom-0 left-0 bg-black bg-opacity-50 text-white px-2 py-1 text-sm">
              {participant.nickname || participant.identity}
              {participant.role === "REP" && " (그리기)"}
              {participant.role === "NOR" && " (맞추기)"}
            </div>
          </div>
        </div>
      );
    });
  };

  // 스타일 정의
  const repStyles = [
    { position: "top-16 left-20", size: "w-90 h-60 rounded-lg shadow-lg" },
    { position: "top-16 left-120", size: "w-85 h-60 rounded-lg shadow-lg" }
  ];
  const norStyles = [
    { position: "top-16 right-20", size: "w-90 h-60 rounded-lg shadow-lg" }
  ];
  const enemyStyles = [
    { position: "bottom-6 right-220", size: "w-85 h-60 rounded-lg shadow-lg" },
    { position: "bottom-6 right-120", size: "w-85 h-60 rounded-lg shadow-lg" },
    { position: "bottom-6 right-20", size: "w-85 h-60 rounded-lg shadow-lg" }
  ];

  // 참가자 분류
  const enemyTeam = turn === "RED" ? "BLUE" : "RED";
  const repGroup = participants.filter((p) => p.role === "REP");
  const norGroup = participants.filter((p) => p.role === "NOR");
  const enemyGroup = participants.filter((p) => p.role === null && p.team === enemyTeam);

  return (
    <div className="relative w-full h-screen overflow-hidden">
      {/* 배경 이미지 */}
      <img
        src={backgroundSketchRelay}
        alt="background_sketch_relay"
        className="absolute top-0 left-0 w-full h-full object-cover -z-10"
      />

      {/* 모든 컨텐츠 */}
      <div className="relative z-10 w-full h-full flex flex-col items-center px-10">
        {/* 현재 팀 턴 */}
        <div className="text-center text-white mb-4">
          <div className="text-3xl font-bold">
            {turn === "RED" ? "RED TEAM TURN" : "BLUE TEAM TURN"}
          </div>
          <div className="text-xl mt-2">
            그리기 턴: {currentDrawTurn + 1} / {maxDrawTurnsPerTeam}
          </div>
          {repIdxList.length > 0 && (
            <div className="text-lg mt-1">
              현재 그리는 순서: {(repIdx || 0) + 1} / {repIdxList.length}
            </div>
          )}
        </div>

        {/* 현재팀 캠 */}
        <div className="relative w-full h-[250px]">
          {renderVideoByRole(repGroup, repStyles)}
          {renderVideoByRole(norGroup, norStyles)}
        </div>

        {/* 칠판과 도구 */}
        <div className="flex flex-row items-start gap-4 my-6 z-20">
          {/* 도구 영역 */}
          <div className="flex flex-col gap-2">
            {/* 역할 표시 */}
            <div className="mb-4 p-3 bg-white bg-opacity-90 rounded-lg min-w-[120px]">
              <div className="text-sm font-bold mb-2 text-center">내 역할</div>
              {userRole === 'drawer' && (
                <div className={`text-center p-2 rounded text-xs ${isMyTurn ? 'bg-green-200' : 'bg-gray-200'}`}>
                  <div className="font-bold">그리는 사람</div>
                  <div>{isMyTurn ? '지금 내 차례!' : '차례 대기중'}</div>
                  {isMyTurn && keyword && (
                    <div className="mt-1 text-red-600 font-bold text-sm">
                      제시어: {keyword}
                    </div>
                  )}
                </div>
              )}
              {userRole === 'guesser' && (
                <div className="text-center p-2 bg-blue-200 rounded text-xs">
                  <div className="font-bold">맞추는 사람</div>
                  <div>그림을 보고 정답을 맞추세요!</div>
                </div>
              )}
              {userRole === 'spectator' && (
                <div className="text-center p-2 bg-yellow-200 rounded text-xs">
                  <div className="font-bold">관전자</div>
                  <div>다른 팀 게임 관전</div>
                </div>
              )}
            </div>

            {/* 그리기 도구 - 그리는 사람만 사용 가능 */}
            {userRole === 'drawer' && (
              <>
                <RightButton 
                  onClick={togglePen} 
                  size="sm"
                  disabled={!isMyTurn}
                  className={!isMyTurn ? 'opacity-50 cursor-not-allowed' : ''}
                >
                  펜
                </RightButton>
                <RightButton 
                  onClick={toggleEraser} 
                  size="sm"
                  disabled={!isMyTurn}
                  className={!isMyTurn ? 'opacity-50 cursor-not-allowed' : ''}
                >
                  지우개
                </RightButton>
                <RightButton
                  onClick={clearCanvas}
                  size="sm"
                  disabled={!isMyTurn}
                  className={!isMyTurn ? 'opacity-50 cursor-not-allowed' : ''}
                >
                  전체지우기
                </RightButton>
              </>
            )}
          </div>

          {/* 칠판 영역 */}
          <div className={`w-[1000px] h-[500px] bg-white rounded-lg border-4 shadow-inner ${
            userRole === 'drawer' && isMyTurn ? 'border-green-400' : 
            userRole === 'guesser' ? 'border-blue-400' : 'border-gray-300'
          }`}>
            <canvas
              ref={canvasRef}
              width={1000}
              height={500}
              className={`w-[1000px] h-[500px] ${
                userRole === 'drawer' && isMyTurn ? 'cursor-crosshair' : 'cursor-default'
              }`}
              onMouseDown={startDrawing}
              onMouseMove={draw}
              onMouseUp={stopDrawing}
              onMouseLeave={stopDrawing}
            />
          </div>
        </div>

        {/* 상대팀 캠 */}
        <div className="relative w-full h-[180px] mt-auto">
          <div className="absolute bottom-70 right-12 text-2xl font-bold text-white">
            {turn === "RED" ? "BLUE TEAM" : "RED TEAM"}
          </div>
          {renderVideoByRole(enemyGroup, enemyStyles)}
        </div>
      </div>

      {/* 타이머 */}
      {isTimerOpen && (
        <div className="absolute top-12 right-64 z-20 scale-150">
          <Timer seconds={time} />
        </div>
      )}

      {/* RoundInfo */}
      <div className="absolute top-12 right-8 z-20 scale-150">
        <RoundInfo
          round={round}
          redScore={teamScore?.RED || 0}
          blueScore={teamScore?.BLUE || 0}
        />
      </div>

      {/* ChatBox */}
      <div className="absolute bottom-4 left-4 z-20">
        <ChatBox width="300px" height="300px" />
      </div>

      {/* 모달들 */}
      <PopUpModal isOpen={isGameStartModalOpen} onClose={closeGameStartModal}>
        <p className="text-6xl font-bold font-pixel">GAME START</p>
      </PopUpModal>

      <PopUpModal isOpen={isTurnModalOpen} onClose={closeTurnModal}>
        <div className="text-center">
          <p className="text-4xl font-bold font-pixel mb-2">{turn} 팀 차례!</p>
          <p className="text-xl font-pixel">라운드 {round}</p>
        </div>
      </PopUpModal>

      <SubmitModal 
        isOpen={isSubmitModalOpen} 
        onClose={() => setIsSubmitModalOpen(false)}
      />

      {isWinModalOpen && (
        <GameResultModal
          win={win}
          redTeam={redTeamFallback}
          blueTeam={blueTeamFallback}
          onClose={() => setIsWinModalOpen(false)}
        />
      )}
    </div>
  );
};

export default SketchRelayPage;