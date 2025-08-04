// src/sockets/common/game/handleGameMessage.js

export default async function handleGameMessage(msg, handlers) {
    const { type, payload } = msg;
  
    switch (type) {
      // -----------------------------
      // 응답(Response) 메시지
      // -----------------------------
  
      case "GAME_TURN_OVERED":
        console.log("턴이 종료되었습니다:", payload);
        handlers?.onGameTurnOvered?.(payload);
        break;
  
      case "GAME_ROUND_OVERED":
        console.log("라운드 종료:", payload);
        handlers?.onGameRoundOvered?.(payload);
        break;
  
      case "GAME_NEW_ROUND":
        console.log("새로운 라운드 시작:", payload);
        handlers?.onGameNewRound?.(payload);
        break;
  
      case "GAME_ANSWER_SUBMITTED":
        console.log("정답 제출 결과:", payload);
        handlers?.onGameAnswerSubmitted?.(payload);
        break;
      
      case "GAME_PASSED":
        console.log("제시어 패스:", payload);
        handlers?.onGamePassed?.(payload);
        break;
      
      case "GAME_PAINTER_CHANGED":
        console.log("그림 그리는 사람 변경:", payload);
        handlers?.onGamePainterChanged?.(payload);
        break;

      default:
        console.warn("[GAME] 처리되지 않은 메시지:", msg);
        break;
    }
  }
  