// src/sockets/waiting/onMessage.js

export const handleWaitingMessage = (
    data,
    { user, setRoom, setTeam, setIsReady, navigate }
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
        case "ROOM_JOINED":
            console.log("ROOM_JOINED 수신", data);
            updateClientState(data.room);
            break;

        case "USER_TEAM_CHANGED":
            console.log("USER_TEAM_CHANGED 수신", data);
            updateClientState(data.room);
            break;

        case "USER_READY_CHANGED":
            console.log("USER_READY_CHANGED 수신", data);
            updateClientState(data.room);
            break;

        case "CHANGED_GAMETYPE":
            console.log("게임 타입 변경됨", data);
            updateClientState(data.room);
            break;

        case "PLAYER_LEFT": {
            console.log("PLAYER_LEFT 수신", data);

            const room = data.room;
            const stillInRoom = [...room.RED, ...room.BLUE].some((u) => u.id === user.id);

            if (!stillInRoom) {
                console.warn("🟠 강퇴됨: 홈으로 이동");
                navigate("/home", { state: { kicked: true } });
                return;
            }

            updateClientState(room);
            break;
        }

        case "LEAVE":
            console.log("LEAVE 수신:", data);
            if (data.msg === "Lobby 로 돌아갑니다.") {
                navigate("/home");
            }
            break;

        case "STARTED_GAME": {
            console.log("게임 시작:", data);
            const gameType = data.room?.gameType?.toLowerCase();
            const roomId = data.room?.id;
            if (gameType && roomId) {
                navigate(`/${gameType}/${roomId}`);
            }
            break;
        }

        case "UPDATE_ROOM_LIST":
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
