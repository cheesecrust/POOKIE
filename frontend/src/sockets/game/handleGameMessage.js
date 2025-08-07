// src/sockets/common/game/handleGameMessage.js
import useGameStore from "../../store/useGameStore";

export default async function handleGameMessage(msg, handlers) {
  const { type } = msg;

  switch (type) {
    // -----------------------------
    // 응답(Response) 메시지
    // -----------------------------
    case "GAME_KEYWORD":
      // livekit 연결
      const { repIdxList, norIdxList, keywordList } = msg;
      if (!keywordList || !Array.isArray(keywordList)) {
        return;
      }
      useGameStore.getState().setGameRoles({ repIdxList, norIdxList });
      console.log("제시어:", msg);
      handlers?.onGameKeyword?.(msg);
      break;

    case "TIMER":
      handlers?.onTimer?.(msg);
      break;

    case "TIMER_PREPARE_START":
      handlers?.onTimerPrepareStart?.(msg);
      break;

    case "TIMER_PREPARE_END":
      handlers?.onTimerPrepareEnd?.(msg);
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
      handlers?.onGameAnswerSubmitted?.(msg);
      break;

    case "GAME_PASSED":
      handlers?.onGamePassed?.(msg);
      break;

    case "WAITING_GAME_OVER":
      console.log("게임 종료:", msg);
      handlers?.onWaitingGameOver?.(msg);
      break;

    case "GAME_PAINTER_CHANGED":
      console.log("그림 그리는 사람 변경:", msg);
      handlers?.onGamePainterChanged?.(msg);
      break;

    case "GAME_DRAW_EVENT":
      console.log("그리기 이벤트 수신:", msg);
      handlers?.onDrawEvent?.(msg);
      break;

    default:
      console.warn("[GAME] 처리되지 않은 메시지:", msg);
      break;
  }
}