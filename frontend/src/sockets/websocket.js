// src/sockets/common/websocket.js

import { handleSocketMessage } from "./handler";

let socket = null;

/**
 * WebSocket 연결
 * @param {Object} config
 * @param {string} config.url - ws:// 또는 wss:// 주소
 * @param {string} config.token 
 * @param {Object} config.handlers 
 * @param {function} config.onOpen
 * @param {function} config.onClose
 * @param {function} config.onError
 */
export const connectSocket = ({
  url,
  token,
  handlers, // 핸들러
  onOpen,
  onClose,
  onError,
}) => {
  const fullUrl = `${url}?token=${token}`;
  socket = new WebSocket(fullUrl);

  socket.onopen = (e) => {
    console.log("[WebSocket OPEN]", e);
    onOpen?.(e);
  };

  socket.onmessage = async (e) => {
    try {
      const msg = JSON.parse(e.data);

      if (!msg.type) {
        console.warn("[WebSocket MESSAGE] type 없음:", msg);
        return;
      }

      console.log(`[WebSocket MESSAGE] type: ${msg.type}`, msg);
      await handleSocketMessage(msg, handlers);  // 공통 핸들러를 담당하는 함수  handlers.js에 있는 함수
    } catch (err) {
      console.error("[WebSocket MESSAGE ERROR]", err);
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
    socket.send(JSON.stringify({ type, payload: data }));
    console.log("보낸 소켓 메시지:", { type, payload: data });
  } else {
    console.warn("[X] WebSocket is not open:", { type, payload: data });
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
