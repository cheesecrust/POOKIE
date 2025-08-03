import { useState, useRef, useCallback, useEffect } from "react";
import background_sketchrelay from "../assets/background/background_sketchrelay.gif";
import RoundInfo from "../components/molecules/games/RoundInfo";
import ChatBox from "../components/molecules/common/ChatBox";
import RightButton from "../components/atoms/button/RightButton";
import PopUpModal from "../components/atoms/modal/PopUpModal";
import KeywordModal from "../components/atoms/modal/KeywordModal";
// import {
//   emitGameStart,
//   emitTurnChange,
//   emitRoundOver,
// } from "../sockets/sketchRelay/emit";

// 필요로 하는 정보 ( 소켓 이용 )
// 1. 누구의 턴
// - 레드팀, 블루팀
// - 그리는 사람의 턴 (A -> B -> A -> B 5초씩 30초)
// 2. 제시어 ( 맞히는 사람 빼고 제시어 전달 총 5명)
// 3. 제시어 맞히는 사람 정답 제출하고 확인 맞으면 correct, 틀리면 wrong
// 4. 제시어 맞히면 +1점
// 5. 레드팀,블루팀 한번씩했으면 다음 라운드로 이동 (라운드 정보)
// 6. 3 라운드 끝났으면 총 점수 합계
// 7. 타이머 정보
// 8. 채팅 정보

// 모달 띄우는 경우
// 1. 처음 이 화면 들어왔을때 게임 START 모달 (PopUpModal 이용)
// 2. 턴이 바뀔 때  (PopUpModal 이용)
// 3. 정답 입력 모달 (타이머 30초 끝났을 때) (모달 미정)
// 4. 정답 입력후 맞으면 정답! 틀리면 땡! 모달 (KeywordModal 이용)
// 5. 3라운드 끝났을때 총점 모달 (모달 미정)

const SketchRelayPage = () => {
  // 턴 및 라운드
  const [turn, setTurn] = useState("red");
  const [round, setRound] = useState(1);
  // 타이머
  const [turnTimeLeft, setTurnTimeLeft] = useState(30);
  const [drawerTimeLeft, setDrawerTimeLeft] = useState(5);
  // 플레이어 정보
  const [player, setPlayers] = useState([]);
  // 제시어
  const [keyword, setKeyword] = useState("");
  // 게임 상태
  const [scores, setScores] = useState({ red: 0, blue: 0 });

  // 모달 상태 (게임시작, 턴체인지, 정답입력, 결과확인)
  const [isGamestartModalOpen, setIsGamestartModalOpen] = useState(false);
  const [isKeywordModalOpen, setIsKeywordModalOpen] = useState(false);
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);
  const [isResultModalOpen, setIsResultModalOpen] = useState(false);

  // emit 정해지면 함수 작성

  // 도화지 ref
  const canvasRef = useRef(null);
  // context ref
  const ctxRef = useRef(null);
  // 그리는 중인지 확인
  const [isDrawing, setIsDrawing] = useState(false);
  // 지우개 상태값 (true: 지우개 모드, false: 펜 모드)
  const [isErasing, setIsErasing] = useState(false);

  // 지우개 모드로 전환
  const toggleEraser = () => {
    setIsErasing(true);
  };

  // 펜 모드로 전환
  const togglePen = () => {
    setIsErasing(false);
  };

  // 도화지 전체 지우기 함수
  const clearCanvas = () => {
    const canvas = canvasRef.current;
    const ctx = ctxRef.current;
    if (!canvas || !ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  };

  // 도화지 초기화
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

  // 좌표값 계산 함수
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

  // 스타일 설정 함수 분리
  const setDrawingStyle = useCallback(
    (ctx) => {
      if (isErasing) {
        ctx.lineWidth = 25;
        ctx.globalCompositeOperation = "destination-out";
      } else {
        ctx.lineWidth = 3;
        ctx.globalCompositeOperation = "source-over";
      }
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
    },
    [isErasing]
  );

  const startDrawing = useCallback((e) => {
    const ctx = ctxRef.current;
    if (!ctx) return;

    const { offsetX, offsetY } = getCoordinates(e);

    // 새로운 드로잉 시작
    ctx.beginPath();

    // 시작점 설정
    ctx.moveTo(offsetX, offsetY);

    // 현재 모드에 따라 스타일 설정
    setDrawingStyle(ctx);

    // 그리기 시작
    setIsDrawing(true);
  }, []);

  const draw = useCallback(
    (e) => {
      if (!isDrawing || !ctxRef.current) return;

      const { offsetX, offsetY } = getCoordinates(e);
      const ctx = ctxRef.current;

      // 선 그리기
      ctx.lineTo(offsetX, offsetY);
      ctx.stroke();

      // 새로운 경로 시작점 설정
      ctx.beginPath();
      ctx.moveTo(offsetX, offsetY);

      // 현재 모드에 따라 스타일 재설정 (드래그 중일 때도 스타일 유지)
      setDrawingStyle(ctx);
    },
    [isDrawing, setDrawingStyle]
  );

  const stopDrawing = useCallback(() => {
    const ctx = ctxRef.current;
    if (ctx) {
      ctx.closePath();
    }
    setIsDrawing(false);
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
        {/* 칠판 + 버튼을 같은 줄에 배치 */}
        <div className="flex flex-row items-start gap-4 my-6 z-20">
          {/* 버튼 영역 */}
          <div className="flex flex-col gap-2">
            <RightButton children="펜" onClick={togglePen} size="md" />
            <RightButton children="지우개" onClick={toggleEraser} size="md" />
            <RightButton
              children="전체 지우기"
              onClick={clearCanvas}
              size="md"
            />
          </div>

          {/* 칠판 영역 */}
          <div className="w-[1200px] h-[600px] bg-white rounded-lg border-4 border-gray-300 shadow-inner">
            <canvas
              ref={canvasRef}
              width={1200}
              height={600}
              className="w-[1200px] h-[600px]"
              onMouseDown={startDrawing}
              onMouseMove={draw}
              onMouseUp={stopDrawing}
              onMouseLeave={stopDrawing}
            />
          </div>
        </div>

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
      <div className="absolute bottom-4 left-0 z-20 ">
        <div className="relative w-[300px] h-[300px] ">
          <div className="absolute bottom-0 left-0 ">
            <ChatBox width="300px" height="300px" />
          </div>
        </div>
      </div>
      {/* 테스트용 emit 버튼 */}
      <div className="absolute top-4 left-4 z-20 flex flex-col gap-2">
        {/* <button onClick={() =>{console.log("emitCreateRoom"); emitCreateRoom();} } className="bg-green-300 px-4 py-2 rounded">CREATE_ROOM</button> */}
        {/* <button onClick={() =>{console.log("emitGameStart"); emitGameStart();} } className="bg-green-300 px-4 py-2 rounded">GAME_START</button>
    <button onClick={() =>{console.log("emitTurnChange"); emitTurnChange();} } className="bg-blue-300 px-4 py-2 rounded">TURN_CHANGE</button>
    <button onClick={() =>{console.log("emitRoundOver"); emitRoundOver();} } className="bg-red-300 px-4 py-2 rounded">ROUND_OVER</button> */}
      </div>
    </div>
  );
};

export default SketchRelayPage;
