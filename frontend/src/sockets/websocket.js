// src/sockets/websocket.js

import { handleSocketMessage } from "./handler";
import axiosInstance from "../lib/axiosInstance";
import useAuthStore from "../store/useAuthStore";

let socket = null;
let isConnecting = false;
let currentHandlers = {};
let reconnecting = false;

/**
 * WebSocket 연결
 */
export const connectSocket = ({
  url,
  token,
  handlers,
  onOpen,
  onClose,
  onError,
}) => {
  if (isConnecting) {
    console.log("[WebSocket] 연결 중 - 중복 연결 시도 무시됨");
    return;
  }
  if (socket && socket.readyState === WebSocket.OPEN) {
    console.log("[WebSocket] 이미 연결 완료됨 - 재연결 생략");
    return;
  }

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
    reconnecting = false;
    onOpen?.(e);
  };

  socket.onmessage = async (e) => {
    try {
      const msg = JSON.parse(e.data)
      console.log("[WebSocket MESSAGE]", msg);
      // 일반 메시지 처리
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

  socket.onclose = async (e) => {
    console.log(`[WebSocket CLOSE] code=${e.code}, reason=${e.reason}`);
    onClose?.(e);

    // ✅ code === 1006일 때 토큰 재발급 및 재연결 시도
    if (e.code === 1006 && !reconnecting) {
      reconnecting = true;
      await handleTokenExpirationAndReconnect();
    }
  };
}

// 토큰 갱신 후 재연결 처리 함수
const handleTokenExpirationAndReconnect = async () => {
  try {
    console.log("🔑 토큰 만료 감지 → refresh 시도");
    const res = await axiosInstance.post("/auth/refresh");
    const newAccessToken = res.data.data.accessToken;
    console.log(res);
    console.log(newAccessToken);
    useAuthStore.getState().setAccessToken(newAccessToken);

    // 소켓 재연결
    connectSocket({
      url: import.meta.env.VITE_SOCKET_URL,
      token: newAccessToken,
      handlers: currentHandlers,
    });
  } catch (err) {
    console.error("❌ refresh 실패 → 로그아웃");
    useAuthStore.getState().logout?.();
    closeSocket(1006, "재발급 오류");
  }
};

/**
 * WebSocket 메시지 전송
 */
export const sendMessage = (type, data) => {
  console.log("🔊 sendMessage 호출:", { type, data, socketState: socket?.readyState });

  if (socket?.readyState === WebSocket.OPEN) {
    const message = { type, payload: data };
    socket.send(JSON.stringify(message));
    console.log("✅ 소켓 메시지 전송 완료:", message);
  } else {
    console.warn("❌ WebSocket이 열려있지 않음:", {
      type,
      payload: data,
      socketExists: !!socket,
      readyState: socket?.readyState,
      CONNECTING: WebSocket.CONNECTING,
      OPEN: WebSocket.OPEN,
      CLOSING: WebSocket.CLOSING,
      CLOSED: WebSocket.CLOSED
    });
  }
};

/**
 * 소켓 해제
 */
export const closeSocket = (code = 1000, reason = "Client closed connection") => {
  if (socket) {
    console.log(`[WebSocket CLOSE REQUEST] code=${code}, reason=${reason}`);
    socket.close(code, reason);
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
  if (!socket) return "NONE";

  switch (socket.readyState) {
    case WebSocket.CONNECTING:
      return "CONNECTING";
    case WebSocket.OPEN:
      return "OPEN";
    case WebSocket.CLOSING:
      return "CLOSING";
    case WebSocket.CLOSED:
      return "CLOSED";
    default:
      return "UNKNOWN";
  }
};