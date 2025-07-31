// src/sockets/games/samePose/onMessage.js
/**
 * samePose 게임에서 수신하는 WebSocket 메시지 핸들러
 * @param {Object} msg - JSON.parse(e.data)
 * @param {Object} handlers - 콜백들
 * @param {Function} [handlers.onKeywordReceived] - KEYWORD 수신 시 실행할 콜백
 */
export const handleSamePoseMessage = (msg, { onKeywordReceived }) => {
  switch (msg.type) {
    case "KEYWORD":
      console.log("[samePose] KEYWORD 메시지 수신:", msg);
      onKeywordReceived?.(msg);
      break;

    default:
      console.warn("[samePose] 처리되지 않은 메시지 타입:", msg);
  }
};
