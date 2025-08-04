// src/sockets/common/websocket.js

import { handleSocketMessage } from "./handler";

let socket = null;
let isConnecting = false;
let currentHandlers = {};

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
  // 이미 연결 중이거나 연결되어 있으면 무시
  if (isConnecting || (socket && socket.readyState === WebSocket.OPEN)) {
    console.log("[WebSocket] 이미 연결 중이거나 연결되어 있음");
    return;
  }

  // 기존 소켓이 있으면 먼저 닫기
  if (socket && socket.readyState !== WebSocket.CLOSED) {
    console.log("[WebSocket] 기존 소켓 연결 종료");
    socket.close();
  }

  isConnecting = true;
  const fullUrl = `${url}?token=${token}`;
  socket = new WebSocket(fullUrl);

  socket.onopen = (e) => {
    console.log("[WebSocket OPEN]", e);
    isConnecting = false;
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
      
      // ROOM 관련 메시지 특별 로깅
      if (msg.type.startsWith('ROOM_')) {
        console.log(`🏠 ROOM 메시지 수신:`, msg.type, msg);
      }
      // 현재 핸들러와 초기 핸들러를 병합
      const mergedHandlers = { ...handlers, ...currentHandlers };
      await handleSocketMessage(msg, mergedHandlers);
    } catch (err) {
      console.error("[WebSocket MESSAGE ERROR]", err);
    }
  };

  socket.onerror = (e) => {
    console.error("[WebSocket ERROR]", e);
    isConnecting = false;
    onError?.(e);
  };

  socket.onclose = (e) => {
    console.log("[WebSocket CLOSE]", e);
    isConnecting = false;
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
  isConnecting = false;
};

/**
 * 현재 핸들러 업데이트
 */
export const updateHandlers = (newHandlers) => {
  currentHandlers = { ...currentHandlers, ...newHandlers };
};

/**
 * 소켓 인스턴스 반환
 */
export const getSocket = () => socket;

/**
 * 소켓 연결 상태 확인
 */
export const isSocketConnected = () => {
  return socket && socket.readyState === WebSocket.OPEN;
};

/**
 * 소켓 연결 상태 확인 (모든 상태 포함)
 */
export const getSocketState = () => {
  if (!socket) return 'NONE';
  
  switch (socket.readyState) {
    case WebSocket.CONNECTING: return 'CONNECTING';
    case WebSocket.OPEN: return 'OPEN';
    case WebSocket.CLOSING: return 'CLOSING';
    case WebSocket.CLOSED: return 'CLOSED';
    default: return 'UNKNOWN';
  }
};
