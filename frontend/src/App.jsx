// src/App.jsx
import { BrowserRouter } from "react-router-dom";
import Router from "./routes/Router";

function App() {

  return (
    <BrowserRouter>
      {/* 필요하면 공통 헤더나 레이아웃 컴포넌트 추가 */}
      <Router />
    </BrowserRouter>
  );
}

export default App;
