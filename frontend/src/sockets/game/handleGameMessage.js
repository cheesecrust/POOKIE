// src/sockets/common/game/handleGameMessage.js

export default async function handleGameMessage(msg, handlers) {
    const { type, payload } = msg;
  
    switch (type) {
      // -----------------------------
      // 응답(Response) 메시지
      // -----------------------------
      case "GAME_STARTED":
        console.log("게임이 시작되었습니다:", payload);
        handlers?.onGameStarted?.(payload);
        break;
  
      case "GAME_KEYWORD":
        console.log("제시어 정보:", payload);
        handlers?.onGameKeyword?.(payload);
        break;
  
      case "GAME_TURN_OVERED":
        console.log("턴이 종료되었습니다:", payload);
        handlers?.onTurnOvered?.(payload);
        break;
  
      case "GAME_ROUND_OVERED":
        console.log("라운드 종료:", payload);
        handlers?.onRoundOvered?.(payload);
        break;
  
      case "GAME_NEW_ROUND":
        console.log("새로운 라운드 시작:", payload);
        handlers?.onNewRound?.(payload);
        break;
  
      case "GAME_ANSWER_SUBMITTED":
        console.log("정답 제출 결과:", payload);
        handlers?.onAnswerSubmitted?.(payload);
        break;
  
      case "GAME_PAINTER_CHANGED":
        console.log("그림 그리는 사람 변경:", payload);
        handlers?.onPainterChanged?.(payload);
        break;
  
      default:
        console.warn("[GAME] 처리되지 않은 메시지:", msg);
        break;
    }
  }
  