// src/sockets/waiting/handleWaitingMessage.js
import useGameStore from "../../store/useGameStore";


const handleWaitingMessage = (data, handlers = {}) => {
    const {
        user = {},
        room = {},
        setRoom = () => { },
        setTeam = () => { },
        setIsReady = () => { },
        navigate = () => { },
    } = handlers;

    if (!data?.type) return;

    const {
        setRoom: setGlobalRoom,
        setRtcToken,
        setTurn,
        setRound,
        setRed,
        setBlue,
        setMaster,
        setRoomInfo,
    } = useGameStore.getState();

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
            console.log("🟢 새 사용자 입장:", data.user?.nickname, "| 방 상태 업데이트");
            updateClientState(data.room);
            break;

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
            navigate("/home");
            break;
        }

        case "WAITING_USER_REMOVED": {
            // 본인이 아닌 유저 강퇴됨 → 그냥 방 상태 갱신만
            updateClientState(data.room);
            break;
        }

        case "GAME_STARTED": {
            const { rtc_token, turn, round } = data;
            
            // 전역으로 넣어달라 하십니다
            setRtcToken(rtc_token);
            setTurn(turn);
            setRound(round);
            setRed(room.RED);
            setBlue(room.BLUE);
            setMaster(room.master.id)
            setRoomInfo(room)

            console.log(room)
            console.log(room.master)
            console.log(room.RED)
            console.log(room.BLUE)

            navigate(`/${room.gameType.toLowerCase()}/${room.id}`);
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
