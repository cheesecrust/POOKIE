// src/sockets/minigame/emit.js
// emit과 동시에 navigate 할일 있으면 여기서 
import { sendMessage } from '../websocket';

/**
 * 팀 변경 요청 emit
 */
export const emitMiniGameJoin = () => {
    sendMessage('MINIGAME_JOIN', {
    });
};

// 점수 업데이트
export const emitMiniGameScoreUpdate = ({ score }) => {
    sendMessage('MINIGAME_SCORE_UPDATE', {
        score,
    });
};

// 게임 종료
export const emitMiniGameOver = ({ score }) => {
    sendMessage('MINIGAME_OVER', {
        score,
    });
};

// 게임 퇴장
export const emitMiniGameLeave = ({ roomId } = {}) => {
    console.log("emitMiniGameLeave 실행됨");

    sendMessage('MINIGAME_LEAVE', {
    });
};
