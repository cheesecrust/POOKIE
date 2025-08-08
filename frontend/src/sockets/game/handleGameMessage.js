// src/sockets/common/game/handleGameMessage.js
import useGameStore from "../../store/useGameStore";
import cleanupLiveKit from "../../utils/cleanupLiveKit";

export default async function handleGameMessage(msg, handlers) {
  console.log("🟢 게임 메시지 수신:", msg);
  const { type } = msg;
  console.log("[GAME] 메시지 수신:", msg.type,msg);
  switch (type) {
    // -----------------------------
    // 응답(Response) 메시지
    // -----------------------------
    case "GAME_KEYWORD":
      // livekit 연결
      const { repIdxList, norIdxList, keywordList } = msg;
      // if (!keywordList || !Array.isArray(keywordList)) {
      //   return;
      // }
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
      const src = msg.payload ?? msg;
      const { norId, inputAnswer, clientMsgId } = src;
      const { bubbles, addBubble, removeBubble } = useGameStore.getState();

      
      // 안전장치: 필수값 없으면 무시
      if (!norId || typeof inputAnswer !== "string") {
        console.warn("[GAME] ANSWER_SUBMITTED payload invalid:", msg);
        handlers?.onGameAnswerSubmitted?.(msg);
        break;
      }

      // 중복 방지
      if (clientMsgId && Array.isArray(bubbles) && bubbles.some(b => b.id === clientMsgId)) {
        handlers?.onGameAnswerSubmitted?.(msg);
        break;
      }

      const id = clientMsgId || `${Date.now()}-${norId}`;
      const normalizedUserId = Number.isNaN(Number(norId)) ? String(norId) : Number(norId);

        addBubble({
          id,
          userId: normalizedUserId,        // 네 렌더에서 p.userAccountId와 비교하니 필드 맞춤
          text: inputAnswer,
          ts: Date.now(),
        });

        // 2.5초 후 자동 제거 (원하는 시간으로 조절)
        setTimeout(() => {
          // 최신 스토어에서 제거 호출 (클로저 안전)
          useGameStore.getState().removeBubble(id);
        }, 2500);

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