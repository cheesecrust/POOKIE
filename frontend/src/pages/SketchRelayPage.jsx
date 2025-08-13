// src/pages/SketchRelayPage.jsx

import { useEffect, useState, useRef, useCallback, useMemo } from "react";
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
import KeywordCard from "../components/atoms/modal/KeywordCard";
import useSound from "../utils/useSound";

import useAuthStore from "../store/useAuthStore.js";
import useGameStore from "../store/useGameStore";
import {
  emitAnswerSubmit,
  emitTurnOver,
  emitRoundOver,
  emitTimerStart,
  emitDrawEvent,
  emitPainterChange,
} from "../sockets/game/emit.js";
import { updateHandlers } from "../sockets/websocket";

const SketchRelayPage = () => {
  const navigate = useNavigate();
  const { playSound } = useSound();

  // 방 정보 선언
  const master = useGameStore((state) => state.master);
  const { user } = useAuthStore();
  const myIdx = user?.userAccountId;

  const participants = useGameStore((state) => state.participants);

  const roomId = useGameStore((state) => state.roomId);
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
  const maxDrawTurnsPerTeam = useGameStore(
    (state) => state.maxDrawTurnsPerTeam
  );
  const currentDrawer = useMemo(() => {
    if (!Array.isArray(repIdxList) || repIdxList.length === 0) return null;
    return repIdxList[currentDrawTurn % repIdxList.length];
  }, [repIdxList, currentDrawTurn]);

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

  // 공통 id 추출
  const pickId = (u) => {
    if (!u) return NaN;
    const cands = [
      u.userAccountId,
      u.id,
      u.identity,
      u.user?.id,
      u.user?.userAccountId,
      u.uid,
      u.userId,
    ];
    for (const c of cands) {
      const n = Number(c);
      if (!Number.isNaN(n)) return n;
    }
    return NaN;
  };

  const myIdNum = useMemo(() => Number(myIdx ?? NaN), [myIdx]);

  const myTeam = useMemo(() => {
    if (Number.isNaN(myIdNum)) return null;

    // 1) red/blue 배열 우선
    if ((red ?? []).some((u) => pickId(u) === myIdNum)) return "RED";
    if ((blue ?? []).some((u) => pickId(u) === myIdNum)) return "BLUE";

    // 2) participants에 team 정보가 있으면 사용
    const p = (participants ?? []).find((u) => pickId(u) === myIdNum);
    if (p?.team === "RED" || p?.team === "BLUE") return p.team;

    return null; // 초기 로딩 동안
  }, [red, blue, participants, myIdNum]);
  console.log("myTeam", myTeam);

  // 팀 데이터가 없으면 participants에서 추출
  const redTeamFallback =
    red.length > 0 ? red : participants.filter((p) => p.team === "RED");
  const blueTeamFallback =
    blue.length > 0 ? blue : participants.filter((p) => p.team === "BLUE");

  // 모달
  const isGameStartModalOpen = useGameStore(
    (state) => state.isGamestartModalOpen
  );
  const isTurnModalOpen = useGameStore((state) => state.isTurnModalOpen);
  const isCorrectModalOpen = useGameStore((state) => state.isCorrectModalOpen);
  const isWrongModalOpen = useGameStore((state) => state.isWrongModalOpen);
  const closeGameStartModal = useGameStore(
    (state) => state.closeGamestartModal
  );
  const closeTurnModal = useGameStore((state) => state.closeTurnModal);
  const closeCorrectModal = useGameStore((state) => state.closeCorrectModal);
  const closeWrongModal = useGameStore((state) => state.closeWrongModal);
  const showTurnChangeModal = useGameStore(
    (state) => state.showTurnChangeModal
  ); // 턴 바뀔때 모달

  // 첫 시작 모달
  const handleTimerPrepareSequence = useGameStore(
    (state) => state.handleTimerPrepareSequence
  );

  // 상태 관리 (로컬)
  const [keyword, setKeyword] = useState("");
  const [isTimerOpen, setIsTimerOpen] = useState(true);
  const [answerInput, setAnswerInput] = useState(""); // 정답 입력

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
    if (!myIdx || !turn) {
      console.log("역할 결정 조건 미충족:", { myIdx, turn });
      return;
    }

    // 바깥 useMemo에서 계산된 myTeam만 사용
    if (!myTeam) {
      console.log("팀 정보 대기중 (myTeam 없음).");
      return;
    }

    console.log("역할 결정 중:", {
      myIdx,
      myTeam,
      currentTurn: turn,
      repIdxList,
      norIdxList,
      repIdx,
      isMyTeamTurn: myTeam === turn,
    });

    // 현재 턴인 팀이 아니면 관전자
    if (myTeam !== turn) {
      setUserRole("spectator");
      setIsMyTurn(false);
      console.log(`다른 팀 턴 (내 팀: ${myTeam}, 현재 턴: ${turn}) - 관전자`);
      return;
    }

    console.log(repIdxList.some((item) => item.idx === myIdx));
    console.log(norIdxList.some((item) => item.idx === myIdx));
    // 현재 턴인 팀의 사람들 중에서 역할 결정
    if (repIdxList.some((item) => item.idx === myIdx)) {
      setUserRole("drawer");

      // 현재 팀 그리는 사람들 중에서 내 순서 확인
      const myIndexInDrawerList = repIdxList.findIndex(
        (item) => item.idx === myIdx
      );
      const currentDrawIdx = currentDrawTurn % repIdxList.length; // 현재 그리기 턴

      console.log("그리는 사람 순서 확인:", {
        norIdxList,
        myIndexInDrawerList,
        currentDrawIdx,
        currentDrawTurn,
        myIdx,
        myTeam,
        currentTurn: turn,
        isMyTurn: myIndexInDrawerList === currentDrawIdx,
      });

      // 현재 그리는 순서와 내 순서가 일치하는지 확인
      console.log("is my turn: ", myIndexInDrawerList === currentDrawIdx);
      setIsMyTurn(myIndexInDrawerList === currentDrawIdx);
    } else if (norIdxList.some((item) => item.idx === myIdx)) {
      // 나머지는 맞추는 사람
      setUserRole("guesser");
      setIsMyTurn(false);
      console.log(`맞추는 역할 부여 (팀: ${myTeam})`);
    }
  }, [
    myIdx,
    myTeam,
    turn,
    red,
    blue,
    participants,
    currentDrawTurn,
    repIdxList,
    norIdxList,
    repIdx,
  ]);

  // // +) 내 역할 차례 결정
  // useEffect(() => {
  //   if (!myTeam || !turn) return;

  //   if (myTeam !== turn) {
  //     setUserRole("spectator");
  //     setIsMyTurn(false);
  //     return;
  //   }

  //   console.log(currentDrawer)
  //   // 내 팀 차례라면: 현재 드로어와 비교해 역할 부여
  //   if (currentDrawer?.idx === myIdx) {
  //     setUserRole("drawer");
  //     setIsMyTurn(true);
  //   } else {
  //     setUserRole("guesser");
  //     setIsMyTurn(false);
  //   }
  // }, [myTeam, turn, currentDrawer?.idx, myIdx]);

  // 6️⃣ 첫 로딩 상태 관리
  useEffect(() => {
    if (turn && isFirstLoad) {
      setIsFirstLoad(false);
    }
  }, [turn, isFirstLoad]);

  // 7️⃣ 타이머 종료 시 캔버스 초기화 여부 결정 및 라운드 종료 처리
  useEffect(() => {
    if (isTimerEnd) {
      const { lastTurnResult } = useGameStore.getState();

      // lastTurnResult를 기반으로 캔버스 초기화 여부 결정
      const shouldClearCanvas =
        lastTurnResult?.teamChanged || lastTurnResult?.roundComplete;

      if (shouldClearCanvas) {
        if (lastTurnResult?.teamChanged) {
          console.log("🔄 팀 전환으로 캔버스 초기화");
        } else if (lastTurnResult?.roundComplete) {
          console.log("🏁 라운드 완료로 캔버스 초기화");
        }

        const canvas = canvasRef.current;
        const ctx = ctxRef.current;
        if (canvas && ctx) {
          ctx.clearRect(0, 0, canvas.width, canvas.height);
        }
      } else {
        console.log("📝 같은 팀 내 턴 변경 (nextPainter), 캔버스 유지");
      }

      // 라운드 종료는 이제 setGameTimerEnd에서 처리함

      resetGameTimerEnd();
    }
  }, [isTimerEnd, myIdx, master, roomId, turn, score, resetGameTimerEnd]);

  // 8️⃣ 최종 승자 처리
  useEffect(() => {
    if (win) {
      setIsWinModalOpen(true);
      const timeout = setTimeout(() => {
        sessionStorage.setItem("waitingPageNormalEntry", "true");
        navigate(`/waiting/${roomId}`, { state: { room: roomInfo } });
        useGameStore.getState().setIsNormalEnd(true);
        useGameStore.getState().setIsAbnormalPerson(null);
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

  const setDrawingStyle = useCallback(
    (ctx) => {
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
    },
    [isErasing]
  );

  const startDrawing = useCallback(
    (e) => {
      if (userRole !== "drawer" || !isMyTurn) return;

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
          color: "black",
        },
      });
    },
    [roomId, isErasing, userRole, isMyTurn, setDrawingStyle]
  );

  const draw = useCallback(
    (e) => {
      if (!isDrawing || !ctxRef.current || userRole !== "drawer" || !isMyTurn)
        return;

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
          color: "black",
        },
      });

      ctx.beginPath();
      ctx.moveTo(offsetX, offsetY);
      setDrawingStyle(ctx);

      lastPointRef.current = { x: offsetX, y: offsetY };
    },
    [isDrawing, setDrawingStyle, roomId, isErasing, userRole, isMyTurn]
  );

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
      data: {},
    });
  }, [isDrawing, roomId]);

  const clearCanvas = () => {
    if (userRole !== "drawer" || !isMyTurn) return;

    const canvas = canvasRef.current;
    const ctx = ctxRef.current;
    if (!canvas || !ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    emitDrawEvent({
      roomId,
      drawType: "clear",
      data: {},
    });
  };

  const handlePainterChange = () => {
    if (userRole !== "drawer" || !isMyTurn) return;
    emitPainterChange({
      roomId,
      curRepIdx: repIdx,
    });
  };

  const togglePen = () => setIsErasing(false);
  const toggleEraser = () => setIsErasing(true);

  // 정답 제출 함수
  const handleAnswerSubmit = (e) => {
    e.preventDefault();
    if (!answerInput.trim() || userRole !== "guesser") return;

    emitAnswerSubmit({
      roomId,
      round,
      norId: myIdx,
      keywordIdx,
      inputAnswer: answerInput.trim(),
    });

    setAnswerInput(""); // 입력 필드 초기화
  };

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
    const gameHandlers = {
      onDrawEvent: handleRemoteDrawEvent,
    };

    updateHandlers(gameHandlers);

    return () => {
      updateHandlers({
        onDrawEvent: null,
        // onGameTimerEnd: null,
        // onTimer: null,
        // onGameTimerStart: null,
        // onGameAnswerSubmitted: null
      });
    };
  }, [handleRemoteDrawEvent]);

  // 모달 사운드
  useEffect(() => {
    if (isGameStartModalOpen) {
      playSound("game_start");
    }
  }, [isGameStartModalOpen, playSound]);

  useEffect(() => {
    if (isTurnModalOpen) {
      playSound("turn_change");
    }
  }, [isTurnModalOpen, playSound]);

  useEffect(() => {
    if (isWinModalOpen) {
      playSound("game_over");
    }
  }, [isWinModalOpen, playSound]);

  const isNormalEnd = useGameStore((state) => state.isNormalEnd);
  const isAbnormalPerson = useGameStore((state) => state.isAbnormalPerson);

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
        <div className="absolute top-6 left-1/2 -translate-x-1/2 text-3xl font-bold">
          <span className={turn === "RED" ? "text-red-500" : "text-blue-500"}>
            {turn} TEAM
          </span>{" "}
          TURN
        </div>

        {/* 그리는 사람 */}
        <div className="absolute top-32 left-1/2 -translate-x-1/2 z-10">
          <div
            className="flex flex-col items-center bg-green-500 text-white font-semibold
                      px-4 py-2 border-b-4 border-green-700 rounded"
          >
            {/* 윗줄: 아이콘 + 타이틀 */}
            <div className="flex items-center gap-2">
              <span className="text-2xl">🖌️</span>
              <span className="text-xl font-semibold">그리는 사람</span>
              <span className="text-2xl">🖌️</span>
            </div>

            {/* 아랫줄: 닉네임 */}
            <div className="mt-1 text-3xl font-semibold">
              {currentDrawer?.nickname ?? "대기 중..."}
            </div>
          </div>
        </div>

        {/* 칠판과 도구 */}
        <div className="absolute top-14 left-24 flex flex-row items-start mt-42 gap-4 my-6 z-20">
          {/* 도구 영역 */}
          <div className="flex flex-col gap-2">
            {/* 역할 표시 */}
            <div className="mb-4 p-3 bg-white bg-opacity-90 rounded-lg">
              <div className="text-sm font-bold mb-2 text-center">내 역할</div>
              {userRole === "drawer" && (
                <div
                  className={`w-40 h-12 flex flex-col text-center p-2 rounded text-xs ${isMyTurn ? "bg-green-200" : "bg-gray-200"}`}
                >
                  <div className="font-bold">그리는 사람</div>
                  <div>{isMyTurn ? "지금 내 차례!" : "차례 대기중"}</div>
                </div>
              )}
              {userRole === "guesser" && (
                <div className="flex flex-col text-center p-2 bg-blue-200 rounded text-xs">
                  <div className="font-bold">맞추는 사람</div>
                  <div>
                    <span>그림을 보고</span>
                    <br />
                    <span>정답을 맞추세요!</span>
                  </div>
                </div>
              )}
              {userRole === "spectator" && (
                <div className="w-40 h-12 flex flex-col text-center p-2 bg-yellow-200 rounded text-md">
                  <div className="font-bold">관전자</div>
                </div>
              )}
            </div>

            {/* 그리기 도구 - 그리는 사람만 사용 가능 */}
            {userRole === "drawer" && (
              <>
                <RightButton
                  onClick={togglePen}
                  size="sm"
                  disabled={!isMyTurn}
                  className={!isMyTurn ? "opacity-50 cursor-not-allowed" : ""}
                >
                  펜
                </RightButton>
                <RightButton
                  onClick={toggleEraser}
                  size="sm"
                  disabled={!isMyTurn}
                  className={!isMyTurn ? "opacity-50 cursor-not-allowed" : ""}
                >
                  지우개
                </RightButton>
                <RightButton
                  onClick={clearCanvas}
                  size="sm"
                  disabled={!isMyTurn}
                  className={!isMyTurn ? "opacity-50 cursor-not-allowed" : ""}
                >
                  전체지우기
                </RightButton>
              </>
            )}

            {/* 정답 입력 - 맞추는 사람만 사용 가능 */}
            {userRole === "guesser" && (
              <div className="w-46 flex flex-col text-center p-2 bg-white bg-opacity-90 rounded-lg">
                <div className="text-sm font-bold mb-2 text-center">
                  정답 입력
                </div>
                <form
                  onSubmit={handleAnswerSubmit}
                  className="flex flex-col gap-2"
                >
                  <input
                    type="text"
                    value={answerInput}
                    onChange={(e) => setAnswerInput(e.target.value)}
                    placeholder="정답을 입력하세요"
                    className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                    maxLength={20}
                  />
                  <RightButton
                    type="submit"
                    size="sm"
                    disabled={!answerInput.trim()}
                    className={
                      !answerInput.trim() ? "opacity-50 cursor-not-allowed" : ""
                    }
                  >
                    제출
                  </RightButton>
                </form>
              </div>
            )}
          </div>

          {/* 칠판 영역 */}
          <div
            className={`w-[1000px] h-[500px] bg-white rounded-lg border-4 shadow-inner ${
              userRole === "drawer" && isMyTurn
                ? "border-green-400 shadow-[0_0_20px_#4ade80]"
                : userRole === "guesser"
                  ? "border-blue-400"
                  : "border-gray-300"
            }`}
          >
            <canvas
              ref={canvasRef}
              width={1000}
              height={500}
              className={`w-[1000px] h-[500px] ${
                userRole === "drawer" && isMyTurn
                  ? "cursor-crosshair"
                  : "cursor-default"
              }`}
              onMouseDown={startDrawing}
              onMouseMove={draw}
              onMouseUp={stopDrawing}
              onMouseLeave={stopDrawing}
            />
          </div>
        </div>
      </div>

      {/* 타이머 */}
      {isTimerOpen && (
        <div className="absolute top-12 right-64 z-20 scale-150">
          <Timer seconds={time} />
        </div>
      )}

      {/* RoundInfo */}
      <div className="absolute top-16 right-12 z-20 scale-150">
        <RoundInfo
          round={round}
          redScore={teamScore?.RED || 0}
          blueScore={teamScore?.BLUE || 0}
        />
      </div>

      {/* ChatBox */}
      <div className="absolute bottom-6 left-15 z-20 opacity-80">
        <ChatBox width="300px" height="300px" roomId={roomId} team={myTeam} />
      </div>

      {/* 모달들 */}
      <PopUpModal isOpen={isGameStartModalOpen} onClose={closeGameStartModal}>
        <p className="text-6xl font-bold font-pixel">GAME START</p>
      </PopUpModal>

      <PopUpModal isOpen={isTurnModalOpen} onClose={closeTurnModal}>
        <div className="text-center">
          <p className="text-4xl font-bold font-pixel mb-2">{turn} 팀 차례!</p>
          {userRole === "drawer" && (
            <p className="text-2xl font-bold">당신의 역할은 '그리기'입니다!</p>
          )}
          {userRole === "guesser" && (
            <p className="text-2xl font-bold">당신의 역할은 '맞추기'입니다!</p>
          )}
          {userRole === "spectator" && (
            <p className="text-2xl font-bold">당신의 역할은 '관전자'입니다!</p>
          )}
        </div>
      </PopUpModal>

      <SubmitModal
        isOpen={isSubmitModalOpen}
        onClose={() => setIsSubmitModalOpen(false)}
      />

      {/* 키워드 카드 - 그리는 사람만 표시 */}
      {(userRole === "drawer" || userRole === "spectator") && (
        <div className="absolute top-26 left-24 z-20 w-50 rounded-xl border border-gray-300 bg-white/90 backdrop-blur-sm shadow px-4 py-3 flex flex-col items-center text-center">
          <div className="text-md font-semibold bg-gray-800 text-white px-2 py-0.5 rounded-md">
            제시어
          </div>
          <div className="mt-2 text-2xl font-extrabold leading-tight break-keep text-gray-900">
            {keyword || "정답!"}
          </div>
        </div>      
      )}

      {/* 정답 모달 */}
      <PopUpModal isOpen={isCorrectModalOpen} onClose={closeCorrectModal}>
        <p className="text-4xl font-bold font-pixel text-green-600">정답!</p>
      </PopUpModal>

      {/* 오답 모달 */}
      <PopUpModal isOpen={isWrongModalOpen} onClose={closeWrongModal}>
        <p className="text-4xl font-bold font-pixel text-red-600">오답!</p>
      </PopUpModal>

      {isWinModalOpen && (
        <GameResultModal
          win={win}
          isNormalEnd={isNormalEnd}
          isAbnormalPerson={isAbnormalPerson}
          redTeam={redTeamFallback}
          blueTeam={blueTeamFallback}
          onClose={() => setIsWinModalOpen(false)}
        />
      )}
    </div>
  );
};

export default SketchRelayPage;
