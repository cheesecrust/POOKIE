// src/sockets/common/game/handleGameMessage.js
import useGameStore from "../../store/useGameStore";
import cleanupLiveKit from "../../utils/cleanupLiveKit";

export default async function handleGameMessage(msg, handlers) {
  console.log("🟢 게임 메시지 수신:", msg);
  const { type } = msg;
  const { gameType } = useGameStore.getState();

  switch (type) {
    // -----------------------------
    // 응답(Response) 메시지
    // -----------------------------
    case "GAME_KEYWORD":
      // livekit 연결
      const { repIdxList, norIdxList, keywordList } = msg;

      useGameStore.getState().setGameRoles({ repIdxList, norIdxList });
      handlers?.onGameKeyword?.(msg);
      break;

    case "TIMER":
      handlers?.onTimer?.(msg);
      break;

    case "GAME_TIMER_START":
      handlers?.onGameTimerStart?.(msg);
      break;

    case "GAME_TIMER_END":
      handlers?.onGameTimerEnd?.(msg);
      break;

    case "GAME_TURN_OVERED":
      handlers?.onGameTurnOvered?.(msg);
      break;

    case "GAME_ROUND_OVERED":
      handlers?.onGameRoundOvered?.(msg);
      break;

    case "GAME_NEW_ROUND":
      handlers?.onGameNewRound?.(msg);
      break;

    case "GAME_ANSWER_SUBMITTED":
      useGameStore.getState().processGameAnswerSubmitted(msg);
      handlers?.onGameAnswerSubmitted?.(msg);
      break;

    case "GAME_PASSED":
      handlers?.onGamePassed?.(msg);
      break;

    case "WAITING_GAME_OVER":
      // console.log("게임 종료:", msg);
      // console.log("Livekit 초기화 시작")

      // const roomInstance = useGameStore.getState().roomInstance;
      // const resetLiveKit = useGameStore.getState().resetLiveKit;

      // // LiveKit 연결 해제 및 정보 초기화
      // try {
      //   cleanupLiveKit({ roomInstance, resetLiveKit });
      // } catch (err) {
      //   console.error("LiveKit 정리 중 오류 발생", err);
      // }

      // console.log("📍 초기화 이후 상태");
      handlers?.onWaitingGameOver?.(msg);
      // handleWaitingMessage(msg, handlers); // setroom을 위한
      break;

    case "GAME_PAINTER_CHANGED":
      console.log("그림 그리는 사람 변경:", msg);
      handlers?.onGamePainterChanged?.(msg);
      break;

    case "GAME_DRAW_EVENT":
      console.log("그리기 이벤트 수신:", msg);
      handlers?.onDrawEvent?.(msg);
      break;

    case "INTERRUPT":
      console.log("INTERRUPT 메시지 수신:", msg);
      handlers?.onInterrupt?.(msg);
      break;

    default:
      console.warn("[GAME] 처리되지 않은 메시지:", msg);
      break;
  }
}