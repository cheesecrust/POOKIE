// src/sockets/home/emit.js
import { sendMessage } from "../websocket";

/**
 * 로비 입장 emit
*/
export const emitHome = () => {
    sendMessage("ON", {});
};

/**
 * 방 생성/입장 요청 emit
 * roomId 존재 -> 기존 방 입장
 * roomTitle 존재 -> 방 생성 후 입장
*/
export const emitRoomJoin = ({ roomId, roomTitle, gameType, roomPw }) => {
    sendMessage("ROOM_JOIN", {
        roomId: roomId ?? null,
        roomTitle: roomTitle ?? null,
        gameType,
        roomPw: roomPw ?? "",
    });
};