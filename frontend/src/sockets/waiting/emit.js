// src/sockets/waiting/emit.js

import { sendMessage } from "../common/websocket";

/**
 * 팀 변경 요청 emit
 */
export const emitTeamChange = ({ roomId, curTeam }) => {
    sendMessage("USER_TEAM_CHANGE", {
        roomId,
        curTeam,
    });
};

/**
 * 준비 상태 변경 요청 emit
 */
export const emitReadyChange = ({ roomId, team }) => {
    sendMessage("USER_READY_CHANGE", {
        roomId,
        team,
    });
};

/**
 * 대기방 나가기 요청 emit
 */
export const emitLeaveRoom = ({ roomId }) => {
    sendMessage("LEAVE_ROOM", {
        roomId,
    });
};

/**
 * 강제 퇴장 요청 emit (방장만 가능)
 */
export const emitForceRemove = ({ roomId, removeTargetId, removeTargetNickname, removeTargetTeam }) => {
    sendMessage("USER_FORCED_REMOVE", {
        roomId,
        removeTargetId,
        removeTargetNickname,
        removeTargetTeam,
    });
};

/**
 * 게임 시작 요청 emit (방장만 가능)
 */
export const emitStartGame = ({ roomId }) => {
    sendMessage("START_GAME", {
        roomId,
    });
};