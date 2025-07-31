// src/sockets/chat/emitChat.js
import { sendMessage } from "../common/websocket";

/**
 * 채팅 메시지 전송 (전체 또는 팀 채팅)
 * @param {Object} payload
 * @param {string} payload.roomId - 방 ID
 * @param {"ALL"|"RED"|"BLUE"} payload.team - 채팅 대상
 * @param {string} payload.message - 전송할 메시지
 * @param {Object} payload.user - 보낸 유저 정보
 */
export const emitChatMessage = ({ roomId, team, message, user }) => {
    const payload = {
        roomId,
        message,
        user,
    };
    if (team && team !== "ALL") payload.team = team;

    sendMessage("CHAT", payload);
};