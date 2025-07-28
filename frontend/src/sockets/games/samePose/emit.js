import { sendMessage } from "../../common/websocket";

/**
 * 대기방 입장 요청 emit
 * roomPw는 생략 가능
 */
export const emitJoinRoom = ({ roomId, gameType, user, roomPw }) => {
    const payload = {
        roomId,
        gameType,
        user,
    };
    if (roomPw) payload.roomPw = roomPw;

    sendMessage("JOIN_ROOM", payload);
};

/**
 * 팀 변경 요청 emit
 */
export const emitTeamChange = ({ roomId, fromTeam, toTeam, user }) => {
    sendMessage("TEAM_CHANGE", {
        roomId,
        fromTeam,
        toTeam,
        user,
    });
};

/**
 * 준비 상태 변경 요청 emit
 */
export const emitReadyChange = ({ roomId, team, ready, user }) => {
    sendMessage("USER_READY_CHANGE", {
        roomId,
        team,
        ready,
        user,
    });
};

/**
 * 대기방 나가기 요청 emit
 */
export const emitLeaveRoom = ({ roomId, user }) => {
    sendMessage("LEAVE_ROOM", {
        roomId,
        user,
    });
};

/**
 * 강제 퇴장 요청 emit (방장만 가능)
 */
export const emitForceRemove = ({ roomId, removeTargerId, removeTargetTeam, roomMaster }) => {
    sendMessage("FORCED_REMOVE", {
        roomId,
        removeTargerId,
        removeTargetTeam,
        roomMaster,
    });
};
