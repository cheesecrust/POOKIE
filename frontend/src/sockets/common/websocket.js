// src/sockets/common/websocket.js

let socket = null;

/**
 * WebSocket 연결
 * @param {Object} config
 * @param {string} config.url - ws:// 또는 wss:// 주소
 * @param {string} config.token - JWT 토큰
 * @param {function} config.onMessage
 * @param {function} config.onOpen
 * @param {function} config.onClose
 * @param {function} config.onError
 */

export const connectSocket = ({
  url,
  token,
  onMessage,
  onOpen,
  onClose,
  onError
}) => {
  const fullUrl = `${url}?token=${token}`;
  socket = new WebSocket(fullUrl);

  socket.onopen = (e) => {
    console.log("[WebSocket OPEN]", e);
    onOpen?.(e);
  };

  socket.onmessage = (e) => {
    try {
      const data = JSON.parse(e.data);
      onMessage?.(data);
    } catch (err) {
      console.error("[WebSocket MESSAGE PARSE ERROR]", err);
    }
  };

  socket.onerror = (e) => {
    console.error("[WebSocket ERROR]", e);
    onError?.(e);
  };

  socket.onclose = (e) => {
    console.log("[WebSocket CLOSE]", e);
    onClose?.(e);
  };
};

/**
 * WebSocket 메시지 전송
 * @param {string} type - 메시지 타입
 * @param {object} data - payload 데이터
 */
export const sendMessage = (type, data) => {
  if (socket?.readyState === WebSocket.OPEN) {
    socket.send(JSON.stringify({ type, payload:data }));
  } else {
    console.warn("WebSocket is not open:", { type, payload:data });
  }
};

/**
 * 소켓 해제
 */
export const closeSocket = () => {
  if (socket) {
    socket.close();
    socket = null;
  }
};

/**
 * 소켓 인스턴스 반환
 */
export const getSocket = () => socket;