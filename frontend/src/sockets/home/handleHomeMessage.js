// src/sockets/home/handleHomeMessage.js

const handleHomeMessage = (
  data,
  handlers = {}
) => {
  const {
    setRoomList = () => {},
    navigate = () => {},
  } = handlers;
  if (!data?.type) return;

  // 디버깅용 추가
  const updateRoomList = (roomList) => {
    if (!Array.isArray(roomList) || roomList.length === 0) {
      console.warn("🚫 빈 roomList 무시");
      return;
    }
    console.log("📥 상태 갱신: roomList =", roomList);
    console.log("🧩 setRoomList() 호출 직전 - 리스트 길이:", roomList.length);
    setRoomList(roomList);
    console.log("✅ setRoomList 실행 완료");
  };

  switch (data.type) {
    case "ON":
      console.log("🟢 소켓 연결 완료:", data.user?.userId);
      console.log("roomList 수신:", data.roomList)
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

    case "WAITING_JOINED": {
      const roomId = data.room?.id
      if (roomId) {
        console.log("WAITING_JOINED 수신", roomId);
        navigate(`/waiting/${roomId}`);
      } else {
        console.warn("roomId 없음")
      }
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