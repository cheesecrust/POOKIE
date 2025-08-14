// src/hooks/useRefreshExit.js
import { useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { closeSocket } from "../sockets/websocket";

/**
 * F5/Ctrl|Cmd+R/브라우저 새로고침, 뒤로가기(popstate) 때 소켓만 끊는다.
 * redirect=true 로 주면 끊고 /home 으로 이동(새로고침의 경우 다음 로드에서 이동).
 */
export default function useRefreshExit({ redirect = false } = {}) {
    const navigate = useNavigate();
    const location = useLocation();

    useEffect(() => {
        const goHome = () => navigate("/home", { replace: true });

        // ---- 뒤로가기: 센티넬 push 후 popstate에서 소켓 끊기 ----
        history.pushState({ _guard: true }, "", location.pathname + location.search + location.hash);
        const onPopState = () => {
            closeSocket(1000, "Back/Leave");
            if (redirect) goHome();
            // 뒤로가기 스택 유지
            history.pushState({ _guard: true }, "", location.pathname + location.search + location.hash);
        };

        // ---- F5 / Ctrl|Cmd+R: 새로고침 가로채서 소켓 끊기 ----
        const onKeyDown = (e) => {
            const isRefresh = e.key === "F5" || ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "r");
            if (!isRefresh) return;
            e.preventDefault();
            closeSocket(1000, "RefreshKey");
            if (redirect) goHome(); // 실제 reload 막고 홈으로
        };

        // ---- 브라우저 새로고침 버튼/탭 닫기: 언로드 직전 소켓 끊기 ----
        const onBeforeUnload = () => {
            closeSocket(1000, "BeforeUnload");
            if (redirect) sessionStorage.setItem("redirectAfterReload", "1");
            // 커스텀 확인창은 안 띄움
        };

        // ---- 재로드된 경우: 플래그 있으면 홈 이동 ----
        if (redirect && sessionStorage.getItem("redirectAfterReload") === "1") {
            sessionStorage.removeItem("redirectAfterReload");
            // 혹시 남아있으면 한 번 더 정리
            closeSocket(1000, "ReloadRedirect");
            goHome();
        }

        window.addEventListener("popstate", onPopState);
        window.addEventListener("keydown", onKeyDown);
        window.addEventListener("beforeunload", onBeforeUnload);

        return () => {
            window.removeEventListener("popstate", onPopState);
            window.removeEventListener("keydown", onKeyDown);
            window.removeEventListener("beforeunload", onBeforeUnload);
        };
    }, [location.pathname, location.search, location.hash, navigate, redirect]);
}
