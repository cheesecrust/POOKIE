// src/sockets/waiting/onMessage.js

export const handleWaitingMessage = (data, { user, setRoom, setTeam, setIsReady, navigate }) => {
    if (!data?.type) return;

    switch (data.type) {
        case "ROOM_JOINED":
        case "USER_TEAM_CHANGED":
        case "USER_READY_CHANGED":
        case "CHANGED_GAMETYPE":
        case "PLAYER_LEFT": {


            const room = data.room;
            setRoom(room);

            console.log("onMessage:", data);

            // 본인이 속한 팀 추출
            const myTeam = room.RED.some((u) => u.id === user.id)
                ? "RED"
                : room.BLUE.some((u) => u.id === user.id)
                    ? "BLUE"
                    : null;

            setTeam(myTeam);

            // 준비 여부 판단
            const me = room[myTeam]?.find((u) => u.id === user.id);
            setIsReady(me?.status === "READY");
            break;
        }

        case "LEAVE":
            if (data.msg === "Lobby 로 돌아갑니다.") {
                navigate("/home");
            }
            console.log("수신된 LEAVE 메시지:", data);
            break;

        case "STARTED_GAME": {
            const gameType = data.room?.gameType?.toLowerCase();
            const roomIdFromState = data.room?.id;
            if (gameType && roomIdFromState) {
                navigate(`/${gameType}/${roomIdFromState}`);
            }
            break;
        }
        case "UPDATE_ROOM_LIST":
            return;

        case "REMOVED_ROOM":
            return;

        case "ERROR":
            alert(data.msg);
            break;

        default:
            console.warn("처리되지 않은 메시지:", data);
    }
};
