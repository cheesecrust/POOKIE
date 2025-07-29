// src/App.jsx
import { BrowserRouter } from "react-router-dom";
import { useEffect } from "react"
import Router from "./routes/Router";
import useAuthStore from "./store/store";

function App() {
  const loadUserFromStorage = useAuthStore((state) => state.loadUserFromStorage);

  useEffect(() => {
    loadUserFromStorage(); // 새로고침 시 로그인 상태 복원
  }, []);

  return (
    <BrowserRouter>
      {/* 필요하면 공통 헤더나 레이아웃 컴포넌트 추가 */}
      <Router />
    </BrowserRouter>
  );
}

export default App;
