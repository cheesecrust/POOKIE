// src/App.jsx
import { BrowserRouter, useNavigate } from "react-router-dom";
import { useEffect } from "react"
import Router from "./routes/Router";
import useAuthStore from "./store/useAuthStore";
import BGMProvider from "./components/audio/BGMProvider";
import SoundWrapper from "./components/organisms/common/SoundWrapper";
import useClickSfx from "./utils/useClickSfx";

// 초대
import InviteGateWatcher from "./components/organisms/invite/InvtieGateWatcher";
import InviteModal from "./components/organisms/invite/InviteModal";


function AppContent() {
  const navigate = useNavigate();
  const loadUserFromStorage = useAuthStore((state) => state.loadUserFromStorage);
  const accessToken = useAuthStore((state) => state.accessToken);

  useEffect(() => {
    if (accessToken) {
      loadUserFromStorage(navigate); // 새로고침 시 로그인 상태 복원 + 소켓 재연결
    }
  }, [navigate, loadUserFromStorage, accessToken]);

  return (
    <>
      <BGMProvider isPlaying={true} />
      <SoundWrapper showOnRoutes={["/", "/login", "/home"]} />
      <InviteGateWatcher />
      <InviteModal />
      <Router />
    </>
  );
}

function App() {
  useClickSfx({
    excludeSelectors: ['.no-sound', '#skipButton'],
    cooldown: 200,
  });
  return (
    <BrowserRouter>
      {/* 필요하면 공통 헤더나 레이아웃 컴포넌트 추가 */}
      <AppContent />
    </BrowserRouter>
  );
}

export default App;