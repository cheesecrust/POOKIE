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

// 타이머 시작
export const emitTimerStart = ({roomId}) => {
  sendMessage("TIMER_START", {
    roomId,
});
};

// 제시어 패스 (고요속의 외침)
export const emitGamePass = ({roomId}) => {
  sendMessage("GAME_PASS", {
    roomId,
});
};

// 그림 그리기 (추후 구현)
export const emitPainterChange = (data) => {
  sendMessage("GAME_PAINTER_CHANGE", data);
};

export const emitDraw = (data) => {
  sendMessage("GAME_DRAW", data);
};
