// src/sockets/home/emit.js

import { sendMessage } from "../../sockets/common/websocket";
import { SOCKET_TYPES } from "../socketTypes";

/**
 * @param {Object} param
 * @param {string} param.roomId - 방 고유 ID (서버에서 발급된 UUID)
 * @param {string} [param.roomTitle] - 방 생성 시 사용
 * @param {string} param.gameType - 게임 타입 (SAMEPOSE, SILENTSCREAM, SKETCHRELAY)
 * @param {string} [param.roomPw] - 비밀번호 (선택)
 */


/**
 * 1.type: "JOIN_ROOM"
 * 방 입장 요청(방 생성 또는 기존 방 입장)
 */
export const emitJoinRoom = ({ roomId, roomTitle, gameType, roomPw }) => {
  if ((!roomId && !roomTitle) || !gameType ) {
    console.warn("❗ emitJoinRoom - roomId 또는 roomTitle, gameType 누락");
    return;
  }

  const payload = { gameType };
  
  // roomId 있으면 roomId 로 보내고, title이 있으면 title로만 보내기
  if (roomId && !roomTitle) {
    payload.roomId = roomId;        // 기존 방 입장
  } else if (roomTitle && !roomId) {
    payload.roomTitle = roomTitle;  // 새 방 생성
  } else {
    console.warn("❗ emitJoinRoom - roomId와 roomTitle을 동시에 보낼 수 없음");
    return;
  }

  if (roomPw) payload.roomPw = roomPw;

  console.log("🟢 emitJoinRoom payload:", payload);
  sendMessage(SOCKET_TYPES.JOIN_ROOM, payload);
};