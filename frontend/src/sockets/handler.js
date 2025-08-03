// src/sockets/common/handler.js

/**
 * 공통 WebSocket 메시지 핸들러 라우터
 * @param {Object} msg - JSON.parse(e.data)
 * @param {Object} handlers - 페이지별 콜백 객체들
 */
export const handleSocketMessage = (msg, handlers) => {
    if (!msg?.type) {
        console.warn("[SocketRouter] type이 없는 메시지 수신:", msg);
        return;
    }

    // ON 메시지 별도 처리
    if (msg.type === "ON") {
        import("./home/handleHomeMessage")
            .then((mod) =>
                mod.default?.(msg, {
                    setRoomList: handlers?.setRoomList
                })
            )
            .catch((err) => {
                console.error("[SocketRouter] ON 핸들러 로딩 실패:", err);
            });
        return;
    }

    // 예외 처리: WAITING_JOINED → home, GAME_STARTED → waiting
    if (msg.type === "WAITING_JOINED") {
        import("./home/handleHomeMessage")
            .then((mod) => mod.default?.(msg,
                {
                    setRoomList: handlers?.setRoomList,
                    navigate: handlers?.navigate,
                }))
            .catch((err) => {
                console.error("[SocketRouter] WAITING_JOINED 핸들러 로딩 실패:", err);
            });
        return;
    }

    if (msg.type === "GAME_STARTED") {
        import("./waiting/handleWaitingMessage")
            .then((mod) =>
                mod.default?.(msg, {
                    user: handlers?.user,
                    room: handlers?.room,
                    setRoom: handlers?.setRoom,
                    setTeam: handlers?.setTeam,
                    setIsReady: handlers?.setIsReady,
                    navigate: handlers?.navigate,
                })
            )
            .catch((err) => {
                console.error("[SocketRouter] GAME_STARTED 핸들러 로딩 실패:", err);
            });
        return;
    }

    const typePrefix = msg.type.split("_")[0];

    const routeMap = { // 접두사로 구분
        ROOM: () => import("./home/handleHomeMessage").then((mod) => mod.default?.(msg, handlers)), // home
        WAITING: () => import("./waiting/handleWaitingMessage").then((mod) =>
            mod.default?.(msg, {
                user: handlers?.user,
                room: handlers?.room,
                setRoom: handlers?.setRoom,
                setTeam: handlers?.setTeam,
                setIsReady: handlers?.setIsReady,
            })), // waiting
        GAME: () => import("./game/onmessage").then((mod) => mod.default?.(msg, handlers)), // game
    };

    const handlerFn = routeMap[typePrefix]; // 접두사있는지 확인

    if (handlerFn) {
        handlerFn().catch((err) => { // 핸들러 로딩 실패
            console.error(`[SocketRouter] ${typePrefix} 핸들러 로딩 실패:`, err);
        });
    } else {
        console.warn("[SocketRouter] 처리되지 않은 typePrefix:", typePrefix); // 처리되지 않은 타입
    }
};
