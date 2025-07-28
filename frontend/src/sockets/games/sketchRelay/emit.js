// src/sockets/games/sketchRelay/emit.js

import { sendMessage } from "../../common/websocket";

// 방생성
export const emitCreateRoom = () => {
  sendMessage("JOIN", {
    roomId: "testRoom",
    gameType: "SKETCH_RELAY",
    user: {
      userId: "1",
    },
  });
};

/**
 * 게임 시작 요청 emit
 */
export const emitGameStart = () => {
  sendMessage({
    type: "GAME_START",
    payload : {
      roomId:  "2fc0f834-5bfc-43d3-b1ac-70f25fe097cd",
    }
  });
};

/**
 * 턴 변경 요청 emit
 */
export const emitTurnChange = () => {
  sendMessage("TURN_CHANGE", {
    roomId: "testRoom",
    team: "RED",
    score: 5,
    user: {
      userId: "testId1",
      userNickname: "testNickname1",
    },
  });
};

/**
 * 라운드 종료 요청 emit
 */
export const emitRoundOver = () => {
  sendMessage("ROUND_OVER", {
    roomId: "testRoom",
    team: "BLUE",
    score: 3,
    user: {
      userId: "testId1",
      userNickname: "testNickname1",
    },
  });
};
