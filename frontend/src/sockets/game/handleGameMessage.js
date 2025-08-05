// src/sockets/common/game/handleGameMessage.js

export default async function handleGameMessage(msg, handlers) {
    console.log("🟢 게임 메시지 수신:", msg);
    const { type} = msg;
  
    switch (type) {
      // -----------------------------
      // 응답(Response) 메시지
      // -----------------------------
      case "TIMER":
        console.log("Timer", msg);
        handlers?.onTimer?.(msg);
        break;

      case "GAME_KEYWORD":
        console.log("제시어:", msg);
        handlers?.onGameKeyword?.(msg);
        break;

      case "GAME_TURN_OVERED":
        console.log("턴이 종료되었습니다:", msg);
        handlers?.onGameTurnOvered?.(msg);
        break;
  
      case "GAME_ROUND_OVERED":
        console.log("라운드 종료:", msg);
        handlers?.onGameRoundOvered?.(msg);
        break;
  
      case "GAME_NEW_ROUND":
        console.log("새로운 라운드 시작:", msg);
        handlers?.onGameNewRound?.(msg);
        break;
  
      case "GAME_ANSWER_SUBMITTED":
        console.log("정답 제출 결과:", msg);
        handlers?.onGameAnswerSubmitted?.(msg);
        break;
      
      case "GAME_PASSED":
        console.log("제시어 패스:", msg);
        handlers?.onGamePassed?.(msg);
        break;
      
      // case "GAME_PAINTER_CHANGED":
      //   console.log("그림 그리는 사람 변경:", msg);
      //   handlers?.onGamePainterChanged?.(msg);
      //   break;
      
      // case "TIMER_PREPARE_START":
      //   console.log("prepare start:", data);
      //   handlers?.onTimerPrepareStart?.(data);
      //   break;


      default:
        console.warn("[GAME] 처리되지 않은 메시지:", msg);
        break;
    }
  }
  