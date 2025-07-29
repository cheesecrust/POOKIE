// src/sockets/home/onmessage.js

import { SOCKET_TYPES } from "../socketTypes";

/**
 * 홈 페이지에서 수신하는 메시지 핸들러
 * @param {Object} msg - 수신 메시지
 * @param {Function} updateRoomList - 업데이트 되는 roomList 저장 함수
 * @param {Function} navigateToWaiting - 대기실로 이동시키는 함수
 * @param {Function} showErrorModal - 에러 모달 띄우기 함수
 * @param {Function} [closeRoomModal] - 방 생성 모달 닫기 함수
 */

export const handleHomeSocketMessage = (
    msg,
    {
      onRoomListReceived,
      onUserReceived,
      navigateToWaiting,
      showErrorModal,
      closeRoomModal,
    }
  ) => {
  switch (msg.type) {
    case "ON":
      // 초기 연결 시, roomList, user 정보 수신
      if (msg.roomList) onRoomListReceived(msg.roomList);
      if (msg.user) onUserReceived(msg.user);

      console.log("🟢 소켓 연결 완료:", msg.user?.userId);
      break;

    case SOCKET_TYPES.ROOM_JOINED:
        if (closeRoomModal) closeRoomModal();
        navigateToWaiting(msg.room); // 대기실로 이동 (room 정보 전달)
        break;

    case SOCKET_TYPES.ERROR:
        if (showErrorModal) showErrorModal(msg.msg); // 예: "비밀번호가 틀렸습니다"
        break;

    default:
        console.log("Unhandled socket message:", msg);
        break;
  }
};
