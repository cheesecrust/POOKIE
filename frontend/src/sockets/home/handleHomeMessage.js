// src/sockets/home/handleHomeMessage.js
import useRoomStore from "../../store/useRoomStore";

const handleHomeMessage = (
  data,
  handlers = {}
) => {
  console.log("🏠 handleHomeMessage 호출됨");
  console.log("🏠 전달받은 handlers:", Object.keys(handlers));
  console.log("🏠 setRoomList 타입:", typeof handlers?.setRoomList);

  const {
    setRoomList = () => {
      console.warn("⚠️ 기본 setRoomList 함수 사용됨 - 핸들러 등록 실패");
    },
    navigate = () => { },
  } = handlers;

  if (!data?.type) return;

  // 디버깅용 추가
  const updateRoomList = (roomList) => {
    console.log("📥 updateRoomList 호출됨:", roomList);
    console.log("📥 setRoomList 함수:", typeof setRoomList);
    console.log("📥 setRoomList 함수 내용:", setRoomList?.toString?.()?.substring(0, 100));

    if (typeof setRoomList !== 'function') {
      console.error("❌ setRoomList가 함수가 아님:", setRoomList);
      return;
    }

    if (!Array.isArray(roomList)) {
      console.warn("🚫 roomList가 배열이 아님:", typeof roomList, roomList);
      return;
    }

    if (roomList.length === 0) {
      console.warn("🚫 빈 roomList:", roomList);
      // 빈 배열도 업데이트 해야함 (방이 모두 삭제된 경우)
    }

    console.log("📥 상태 갱신: roomList =", roomList);
    console.log("🧩 setRoomList() 호출 직전 - 리스트 길이:", roomList.length);

    try {
      setRoomList(roomList);
      console.log("✅ setRoomList 실행 완료");
    } catch (error) {
      console.error("❌ setRoomList 실행 중 오류:", error);
    }
  };

  switch (data.type) {
    case "ON":
      console.log("🟢 소켓 연결 완료:", data.user?.userId);
      console.log("📋 ON 메시지 구조:", JSON.stringify(data, null, 2));

      // roomList 찾기 - 다양한 경로 확인
      const onRoomList = data.roomList || data.payload?.roomList || data.rooms || data.data?.roomList;

      if (onRoomList) {
        console.log("📋 ON 메시지에서 방 목록 수신:", onRoomList.length, "개 방");
        updateRoomList(onRoomList);
      } else {
        console.warn("⚠️ ON 메시지에서 roomList가 없음");
        console.warn("📋 ON 메시지 사용 가능한 속성들:", Object.keys(data));
      }
      break;

    case "ROOM_LIST": {
      console.log("ROOM_LIST 수신", data);

      const roomList = data.payload?.roomList;
      if (roomList) updateRoomList(roomList);
      break;
    }

    case "ROOM_CREATED": {
      console.log("🟢 새 방 생성됨 - roomList에 추가", data);
      console.log("📋 ROOM_CREATED 메시지:", JSON.stringify(data, null, 2));

      const newRoom = data.room;
      if (newRoom) {
        // 현재 roomList 가져오기
        import("../../store/useRoomStore").then(({ default: useRoomStore }) => {
          const currentRoomList = useRoomStore.getState().roomList || [];

          // 새 방을 roomList에 추가 (중복 방지)
          const roomExists = currentRoomList.some(room => room.roomId === newRoom.roomId);
          if (!roomExists) {
            const updatedRoomList = [...currentRoomList, {
              roomId: newRoom.roomId,
              roomTitle: newRoom.roomTitle,
              gameType: newRoom.gameType,
              roomMaster: newRoom.roomMaster,
              roomPw: newRoom.roomPw,
              teamInfo: {
                red: newRoom.teamInfo?.RED || 0,
                blue: newRoom.teamInfo?.BLUE || 0,
                total: newRoom.teamInfo?.TOTAL || 0
              }
            }];

            console.log("📋 방 추가 완료:", updatedRoomList.length, "개 방");
            updateRoomList(updatedRoomList);
          }
        });
      }

      break;
    }

    case "ROOM_REMOVED": {
      console.log("🟢 방 삭제됨 - roomList에서 제거", data);
      console.log("📋 ROOM_REMOVED 메시지:", JSON.stringify(data, null, 2));

      const removedRoom = data.room;
      if (removedRoom) {
        // 현재 roomList 가져오기
        import("../../store/useRoomStore").then(({ default: useRoomStore }) => {
          const currentRoomList = useRoomStore.getState().roomList || [];

          // 해당 방을 roomList에서 제거
          const updatedRoomList = currentRoomList.filter(room => room.roomId !== removedRoom.roomId);

          console.log("📋 방 제거 완료:", updatedRoomList.length, "개 방");
          updateRoomList(updatedRoomList);
        });
      }

      break;
    }

    // 추가적인 방 관련 메시지들 처리
    case "ROOM_UPDATE": {
      const updatedRoom = data.room;

      // 현재 roomList 상태 가져오기
      const currentRoomList = useRoomStore.getState().roomList;

      // roomId로 찾아서 업데이트
      const idx = currentRoomList.findIndex(room => room.roomId === updatedRoom.roomId);
      if (idx !== -1) {
        const newRoomList = [...currentRoomList];
        newRoomList[idx] = updatedRoom;

        // 상태 저장 (store 또는 handlers 통해)
        if (typeof handlers.setRoomList === "function") {
          handlers.setRoomList(newRoomList);
        } else {
          useRoomStore.getState().setRoomList(newRoomList);
        }
      }
      break;
    }

    case "ROOM_CHANGE": {
      console.log("🟢 추가 방 관련 메시지:", data.type, data);
      const roomList = data.payload?.roomList || data.roomList || data.rooms;
      if (roomList) {
        console.log("📋 추가 메시지에서 방 목록 수신:", roomList.length, "개 방");
        updateRoomList(roomList);
      }
      break;
    }

    case "WAITING_JOINED": {
      const room = data.room;
      const roomId = room?.id;

      console.log("WAITING_JOINED 수신", roomId);
      if (roomId) {
        console.log("✅ navigate 존재 여부", typeof navigate);
        console.log("👉 navigate 직전 실행");
        console.log(room)

        // 정상 입장 플래그 설정
        sessionStorage.setItem('waitingPageNormalEntry', 'true');

        navigate(`/waiting/${roomId}`, { state: { room } });
      } else {
        console.warn("❌ roomId 없음");
      }
      break;
    }


    case "IS_JOINED": {
      const isJoined = data.isJoined;
      const roomId = data.roomId;
      const room = data.room;
      if (isJoined && room) {
        console.log("✅ 현재 방에 참여 중 - 방 상태 복원");

        // 정상 입장 플래그 설정 (재입장)
        sessionStorage.setItem('waitingPageNormalEntry', 'true');

        if (handlers.setRoom) {
          handlers.setRoom(room);
        }
      } else {
        console.log("❌ 현재 방에 참여하지 않음 - 홈으로 이동");
        if (navigate) {
          navigate('/home', { replace: true });
        }
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