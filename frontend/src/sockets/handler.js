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

    const typePrefix = msg.type.split("_")[0];

    const routeMap = { // 접두사로 구분
        ROOM: () => import("./home/handleHomeMessage").then((mod) => mod.default?.(msg, handlers)), // home
        WAITING: () => import("./waiting/onmessage").then((mod) => mod.default?.(msg, handlers)), // waiting
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
