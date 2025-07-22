// src/routes/Router.jsx

import { Routes, Route } from "react-router-dom";
import HomePage from "../pages/HomePage";
import LogInPage from "../pages/LogInPage";
import ManagingPage from "../pages/ManagingPage";
import MyRoomPage from "../pages/MyRoomPage";
import SamePosePage from "../pages/SamePosePage";
import SilentScreamPage from "../pages/SilentScreamPage";
import SketchRelayPage from "../pages/SketchRelayPage";
import WaitingPage from "../pages/WaitingPage";

const Router = () => {
  return (
    <Routes>
      <Route path="/" element={<LogInPage />} />
      <Route path="/home" element={<HomePage />} />
      <Route path="/managing" element={<ManagingPage />} />
      <Route path="/myroom" element={<MyRoomPage />} />
      <Route path="/samepose" element={<SamePosePage />} />
      <Route path="/silentscream" element={<SilentScreamPage />} />
      <Route path="/sketchrelay" element={<SketchRelayPage />} />
      <Route path="/waiting" element={<WaitingPage />} />
    </Routes>
  );
};

export default Router;
