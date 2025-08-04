// src/sockets/waiting/handleWaitingMessage.js

const handleWaitingMessage = (data, handlers = {}) => {
    const {
        user = {},
        room = {},
        setRoom = () => { },
        setTeam = () => { },
        setIsReady = () => { },
    } = handlers;

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

            console.log("WAITING 관련 onMessage", data);
            updateClientState(data.room);
            break;

        case "WAITING_USER_LEAVED": {
            // 지금 유저가 본인이면 -> 홈으로 이동
            if (data.user?.id === user.id) {
                const isKicked = data.reason === "KICKED"; // <- 서버가 reason을 같이 보내줘야 함
                navigate("/home", { state: { kicked: isKicked ?? false } });
            } else {
                updateClientState(data.room); // 나 외의 다른 유저가 나간 경우
            }
            break;
        }

        case "WAITING_USER_REMOVED": {
            // 본인이 아닌 유저 강퇴됨 → 그냥 방 상태 갱신만
            updateClientState(data.room);
            break;
        }

        case "GAME_STARTED": {
            const { rtc_token, turn, msg } = data;

            console.log("🟢 게임 시작 메시지 수신:", data);

            navigate(`/${room.gameType.toLowerCase()}/${room.id}`, {
                state: {
                    rtcToken: rtc_token,
                    turn,
                    msg,
                },
            });

            break;
        }

        case "ERROR":
            console.error("❌ 서버 오류:", data.msg);
            alert(data.msg);
            break;

        default:
            console.warn("⚠️ 처리되지 않은 메시지 타입:", data);
    }
};

export default handleWaitingMessage;
