// src/sockets/common/game/emit.js
import { sendMessage } from "../websocket";

// -----------------------------
// 요청(Request) 메시지
// -----------------------------

// 턴 종료
export const emitTurnOver = ({roomId, team,score}) => {
  sendMessage("GAME_TURN_OVER", {
    roomId,
    team,
    score
});
};

// 라운드 종료
export const emitRoundOver = ({roomId,team,score}) => {
  sendMessage("GAME_ROUND_OVER", {
    roomId,
    team,
    score
});
};

// 정답 제출
export const emitAnswerSubmit = ({roomId,round,norId,keywordIdx,inputAnswer}) => {
  sendMessage("GAME_ANSWER_SUBMIT", {
    roomId,
    round,
    norId,
    keywordIdx,
    inputAnswer
});
};

// 제시어 패스 (고요속의 외침)
export const emitGamePass = ({roomId}) => {
  sendMessage("GAME_PASS", {
    roomId,
});
};

// 그림 그리기 이벤트
export const emitDrawEvent = ({ roomId, drawType, data }) => {
  sendMessage("GAME_DRAW", {
    roomId,
    drawType, // "draw", "clear", "start", "end"
    data: {
      x: data.x,
      y: data.y,
      prevX: data.prevX,
      prevY: data.prevY,
      color: data.color || "black",
      brushSize: data.brushSize || 3,
      tool: data.tool || "pen"
    }
  });
};
