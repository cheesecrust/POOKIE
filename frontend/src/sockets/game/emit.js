// src/sockets/game/emit.js
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
export const emitAnswerSubmit = ({roomId,round,norId,keywordIdx,inputAnswer, clientMsgId }) => {
  const _id = clientMsgId || `${Date.now()}-${Math.random().toString(36).slice(2,7)}`;
  sendMessage("GAME_ANSWER_SUBMIT", {
    roomId,
    round,
    norId,
    keywordIdx,
    inputAnswer,
    clientMsgId: _id,
});
};

// 타이머 시작
export const emitTimerStart = ({roomId}) => {
  sendMessage("TIMER_START", {
    roomId,
});
};

// 키워드 요청 (팀 전환 시)
export const emitKeywordRequest = ({roomId}) => {
  sendMessage("GAME_KEYWORD_REQUEST", {
    roomId,
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

// 그리는 사람 변경 (이어그리기)
export const emitPainterChange = ({ roomId, curRepIdx }) => {
  sendMessage("GAME_PAINTER_CHANGE", {
    roomId,
    curRepIdx
  });
};
