// src/sockets/minigame/handleMiniGameMessage.js
const handleMiniGameMessage = (message, handlers = {}) => {
    if (!message?.type) return;

    const {
        setScore,
        setRunning,
        setTimeLeft,
        navigate,
        onScoreSynced,
        setErrorModalOpen,
    } = handlers;

    // 점수 파싱 (room.score 또는 score 둘 다 커버)
    const scoreOf = (m) => {
        const n = Number(m?.room?.score ?? m?.score);
        return Number.isFinite(n) ? n : 0;
    };

    const type = String(message.type).toUpperCase();

    // 통합 에러 처리
    if (type === "ERROR") {
        console.error("❌ 서버 오류:", message?.msg);
        setErrorModalOpen?.(true);
        setTimeout(() => navigate?.("/home"), 1000);
        return;
    }

    switch (type) {
        case "MINIGAME_JOINED": {
            const total = scoreOf(message);
            setScore?.(total);
            onScoreSynced?.(total);
            break;
        }
        case "MINIGAME_SCORE_UPDATED": {
            const total = scoreOf(message);
            setScore?.(total);
            onScoreSynced?.(total);
            break;
        }
        case "MINIGAME_OVERED": {
            const total = scoreOf(message);
            setScore?.(total);
            setRunning?.(false);
            setTimeLeft?.(0);
            break;
        }
        case "MINIGAME_RESET": {
            const total = scoreOf(message);
            setScore?.(total);
            break;
        }
        case "MINIGAME_LEAVED": {
            break;
        }
        default:
            console.warn("⚠️ 미처리 미니게임 메시지:", message);
    }
};

export default handleMiniGameMessage;