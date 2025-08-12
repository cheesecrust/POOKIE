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

    // 예외 처리: WAITING_JOINED는 방 생성/입장 성공시 home에서 처리, GAME_STARTED → waiting
    if (msg.type === "WAITING_JOINED") {
        // HomePage에서 방 생성/입장 후 대기실 이동을 위해 home 핸들러 사용
        import("./home/handleHomeMessage")
            .then((mod) => mod.default?.(msg, {
                setRoomList: handlers?.setRoomList,
                navigate: handlers?.navigate,
            }))
            .catch((err) => {
                console.error("[SocketRouter] WAITING_JOINED(home) 핸들러 로딩 실패:", err);
            });

        // 동시에 대기실에 있는 다른 사용자들에게도 알림
        import("./waiting/handleWaitingMessage")
            .then((mod) => mod.default?.(msg, {
                user: handlers?.user,
                room: handlers?.room,
                setRoom: handlers?.setRoom,
                setTeam: handlers?.setTeam,
                setIsReady: handlers?.setIsReady,
                navigate: handlers?.navigate,
            }))
            .catch((err) => {
                console.error("[SocketRouter] WAITING_JOINED(waiting) 핸들러 로딩 실패:", err);
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

    if (msg.type === "WAITING_GAME_OVER") {
        import("./game/handleGameMessage")
            .then((mod) => mod.default?.(msg, handlers))
            .catch((err) => {
                console.error("[SocketRouter] WAITING_GAME_OVER 핸들러 로딩 실패:", err);
            });
        return;
    }

    // Interrupt 게임중일때 방에서 한명 나갔을때 이벤트 
    if (msg.type === "INTERRUPT") {
        import("./game/handleGameMessage")
            .then((mod) => mod.default?.(msg, handlers))
            .catch((err) => {
                console.error("[SocketRouter] INTERRUPT 핸들러 로딩 실패:", err);
            });
        return;
    }

    const typePrefix = msg.type.split("_")[0];

    // 타이머 게임쪽으로 
    if (typePrefix === "TIMER") {
        import("./game/handleGameMessage")
            .then((mod) => mod.default?.(msg, handlers))
            .catch((err) => {
                console.error("[SocketRouter] TIMER 핸들러 로딩 실패:", err);
            });
        return;
    }



    const routeMap = { // 접두사로 구분
        ROOM: () => {
            console.log(`🏠 ROOM 메시지 라우팅:`, msg.type, "핸들러:", handlers);
            return import("./home/handleHomeMessage").then((mod) => mod.default?.(msg, handlers));
        }, // home
        WAITING: () => import("./waiting/handleWaitingMessage").then((mod) =>
            mod.default?.(msg, {
                user: handlers?.user,
                room: handlers?.room,
                setRoom: handlers?.setRoom,
                setTeam: handlers?.setTeam,
                setIsReady: handlers?.setIsReady,
                navigate: handlers?.navigate,
            })), // waiting
        GAME: () => import("./game/handleGameMessage").then((mod) => mod.default?.(msg, handlers)), // game
        MINIGAME: () => import("./minigame/handleMiniGameMessage").then((mod) => mod.default?.(msg, handlers)), // minigame
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
