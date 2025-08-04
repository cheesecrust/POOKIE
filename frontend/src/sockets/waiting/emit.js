// src/sockets/waiting/emit.js
// emit과 동시에 navigate 할일 있으면 여기서 
import { sendMessage } from '../websocket';

/**
 * 팀 변경 요청 emit
 */
export const emitTeamChange = ({ roomId, curTeam }) => {
	sendMessage('WAITING_TEAM_CHANGE', {
		roomId,
		curTeam,
	});
};

/**
 * 준비 상태 변경 요청 emit
 */
export const emitReadyChange = ({ roomId, team }) => {
	sendMessage('WAITING_READY_CHANGE', {
		roomId,
		team,
	});
};

/**
 * 대기방 나가기 요청 emit
 */
export const emitLeaveRoom = ({ roomId }) => {
	sendMessage('WAITING_USER_LEAVE', {
		roomId,
	});
};

/**
 * 강제 퇴장 요청 emit (방장만 가능)
 */
export const emitForceRemove = ({ roomId, removeTargetId, removeTargetNickname, removeTargetTeam, }) => {
	sendMessage('WAITING_USER_REMOVE', {
		roomId,
		removeTargetId,
		removeTargetNickname,
		removeTargetTeam,
	});
};
/**
 * 게임 타입 변경
 **/
export const emitGameTypeChange = ({ roomId, requestGameType }) => {
	sendMessage('WAITING_GAMETYPE_CHANGE', {
		roomId,
		requestGameType,
	});
};

/**
 * 게임 시작 요청 emit (방장만 가능)
 */
export const emitStartGame = ({ roomId }) => {
	sendMessage('WAITING_GAME_START', {
		roomId,
	});
};
