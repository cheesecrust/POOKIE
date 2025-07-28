// src/sockets/home/emit.js

import { sendMessage } from "../../sockets/common/websocket";
import { SOCKET_TYPES } from "../socketTypes";

/**
 * @param {Object} param
 * @param {string} param.roomId - 방 고유 ID (서버에서 발급된 UUID)
 * @param {string} [param.roomTitle] - 방 생성 시 사용
 * @param {string} param.gameType - 게임 타입 (SAMEPOSE, SILENTSCREAM, SKETCHRELAY)
 * @param {string} [param.roomPw] - 비밀번호 (선택)
 * @param {Object} param.user - 유저 정보
 * @param {string} param.user.userId - 유저 ID
 * @param {string} param.user.userNickname - 유저 닉네임
 */


/**
 * 1.type: "JOIN_ROOM"
 * 방 입장 요청(방 생성 또는 기존 방 입장)
 */
export const emitJoinRoom = ({ roomId, roomTitle, gameType, roomPw, user }) => {
  if ((!roomId && !roomTitle) || !gameType || !user?.userId || !user?.userNickname) {
    console.warn("❗ emitJoinRoom - roomId 또는 roomTitle, gameType, user 누락");
    return;
  }

  const payload = {
    gameType,
    user,
  };

  if (roomId) payload.roomId = roomId;
  if (roomTitle) payload.roomTitle = roomTitle;
  if (roomPw) payload.roomPw = roomPw;

  console.log("🟢 emitJoinRoom payload:", payload);
  sendMessage({
    "type": SOCKET_TYPES.JOIN_ROOM,
     payload
  });
};