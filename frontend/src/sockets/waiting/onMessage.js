// src/sockets/waiting/onMessage.js

const handleWaitingMessage = (
    data,
    { user, setRoom, setTeam, setIsReady }
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

        // // 방 참여
        case "WAITING_JOINED":
        // 팀 변경
        case "WAITING_TEAM_CHANGED":

        // 준비 변경
        case "WAITING_READY_CHANGED":

        // 게임 타입 변경
        case "WAITING_GAMETYPE_CHANGED":

        // 유저가 떠나서 나머지가 받는 응답
        case "WAITING_USER_REMOVED":

            console.log("WAITING 관련 onMessage", data);
            updateClientState(data.room);
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
