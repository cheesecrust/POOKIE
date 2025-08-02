// src/sockets/home/handleHomeMessage.js

const handleHomeMessage = (
  data,
  { setRoomList }
) => {
  if (!data?.type) return;

  const updateRoomList = (roomList) => {
    setRoomList(roomList);
  };

  switch (data.type) {
    case "ON":
      console.log("🟢 소켓 연결 완료:", data.user?.userId);
      if (data.roomList) updateRoomList(data.roomList);
      break;

    case "ROOM_LIST": {
      console.log("ROOM_LIST 수신", data);

      const roomList = data.payload?.roomList;
      if (roomList) updateRoomList(roomList);
      break;
    }

    case "ROOM_CREATED": {
      console.log("ROOM_LIST 갱신(생성)", data)
      const roomList = data.payload?.roomList;
      if (roomList) updateRoomList(roomList);
      break;
    }

    case "ROOM_REMOVED": {
      console.log("ROOM_LSIT 갱신(삭제)", data);
      
      const roomList = data.payload?.roomList;
      if (roomList) updateRoomList(roomList);
      break;
    }

    case "ERROR": {
      console.error("❌ 서버 오류:", data.msg);
      alert(data.msg);
      break;
    }

    default:
      console.warn("처리되지 않은 메시지 타입:", data);
      break;
  }
};

export default handleHomeMessage;