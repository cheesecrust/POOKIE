// src/sockets/games/sketchRelay/emit.js

import { sendMessage } from "../../common/websocket";

// // 
// export const emitConnect = () => {
//   sendMessage("ON", {
//         "userId": "testId3",
//         "userNickname":"testNickname3"
//   });
// };

/**
 * 게임 시작 요청 emit
 */
export const emitGameStart = () => {
  sendMessage("GAME_START", {
    roomId: "testRoom",
    user: {
      userId: "testId2",
      userNickname: "testNickname2",
    },
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
