// src/sockets/waiting/onMessage.js

const handleWaitingMessage = (
    data,
    { user, room, setRoom, setTeam, setIsReady, navigate }
) => {
    if (!data?.type) return;

    const updateClientState = (room) => {
        setRoom(room);

        const myTeam = room.RED.some((u) => u.id === user.id)
            ? "RED"
            : room.BLUE.some((u) => u.id === user.id)
                ? "BLUE"
                : null;

        setTeam(myTeam);

        const me = room[myTeam]?.find((u) => u.id === user.id);
        setIsReady(me?.status === "READY");
    };

    switch (data.type) {
        // 방 참여
        case "WAITING_JOINED":
            console.log("WAITING_JOINED 수신", data);
            updateClientState(data.room);
            break;

        // 팀 변경
        case "WAITING_TEAM_CHANGED":
            console.log("WAITING_TEAM_CHANGED 수신", data);
            updateClientState(data.room);
            break;

        // 준비 변경
        case "WAITING_READY_CHANGED":
            console.log("WAITING_READY_CHANGED 수신", data);
            updateClientState(data.room);
            break;

        // 게임 타입 변경
        case "WAITING_GAMETYPE_CHANGED":
            console.log("WAITING_GAMETYPE_CHANGED 수신", data);
            updateClientState(data.room);
            break;


        // 유저가 떠나서 나머지가 받는 응답
        case "WAITING_USER_REMOVED": {
            console.log("WAITING_USER_REMOVED 수신", data);

            const room = data.room;

            // const msg = data.msg; // ex: "testNickname1가 나갔습니다."

            // // ✨ 채팅창에 시스템 메시지로 표시 가능
            // addSystemChatMessage(msg);

            const stillInRoom = [...room.RED, ...room.BLUE].some((u) => u.id === user.id);

            if (!stillInRoom) {
                console.warn("🟠 강퇴됨: 홈으로 이동");
                navigate("/home", { state: { kicked: true } });
                return;
            }

            updateClientState(room);
            break;
        }

        case "STARTED_GAME": {
            console.log("게임 시작:", data);
            const gameType = room?.gameType?.toLowerCase();
            const roomId = room?.id;
            if (gameType && roomId) {
                navigate(`/${gameType}/${roomId}`);
            }
            break;
        }

        case "UPDATE_ROOM_LIST":
            console.log("UPDATE_ROOM_LIST 수신", data);
            break;

        case "REMOVED_ROOM":
            // 필요 시 여기에 처리 추가
            break;


        case "ERROR":
            console.error("❌ 서버 오류:", data.msg);
            alert(data.msg);
            break;

        default:
            console.warn("⚠️ 처리되지 않은 메시지 타입:", data);
    }
};

export default handleWaitingMessage;
