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
        setTurn,
        setRound,
        setRed,
        setBlue,
        setMaster,
        setRoomInfo,
        setTeamScore,
        setScore,
        setWin,
        setKeywordIdx,
    } = useGameStore.getState();

    const updateClientState = (room) => {
        setRoom(room);

        const myTeam = room.RED.some((u) => u.id === user.userAccountId)
            ? "RED"
            : room.BLUE.some((u) => u.id === user.userAccountId)
                ? "BLUE"
                : null;

        setTeam(myTeam);

        const me = room[myTeam]?.find((u) => u.id === user.userAccountId);
        setIsReady(me?.status === "READY");
    };

    switch (data.type) {

        // // 방 참여
        case "WAITING_JOINED":
            updateClientState(data.room);
            break;

        // 팀 변경
        case "WAITING_TEAM_CHANGED":

        // 준비 변경
        case "WAITING_READY_CHANGED":

        // 게임 타입 변경
        case "WAITING_GAMETYPE_CHANGED":
            updateClientState(data.room);
            break;

        case "WAITING_USER_LEAVED": {
            navigate("/home", { state: { kicked: data.reason === "KICKED" } });
            break;
        }

        case "WAITING_USER_REMOVED": {
            // 본인이 아닌 유저 강퇴됨 → 그냥 방 상태 갱신만
            updateClientState(data.room);
            break;
        }

        case "GAME_STARTED": {
            const { turn, round, game_init } = data;
            console.log("🟢 게임 시작 메시지 수신:", data);
            // 전역으로 넣어달라 하십니다
            setTurn(turn);
            setRound(round);
            setRed(room.RED);
            setBlue(room.BLUE);
            setMaster(room.master.id)
            setRoomInfo(room)

            setWin(game_init.win)
            setTeamScore(game_init.teamScore)
            setScore(game_init.score)

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
