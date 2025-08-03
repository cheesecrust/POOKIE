// src/routes/Router.jsx

import { Routes, Route } from "react-router-dom";
import HomePage from "../pages/HomePage";
import LogInPage from "../pages/LogInPage";
import ManagingPage from "../pages/ManagingPage";
import MyRoomPage from "../pages/MyRoomPage";
import SamePosePage from "../pages/SamePosePage";
import SilentScreamPage from "../pages/SilentScreamPage";
// import SketchRelayPage from "../pages/SketchRelayPage";
import WaitingPage from "../pages/WaitingPage";
// import SketchRelayPage_VIDU from "../pages/SketchRelayPage_openvidu";
const Router = () => {
  return (
    <Routes>
      <Route path="/" element={<LogInPage />} />
      <Route path="/home" element={<HomePage />} />
      <Route path="/managing" element={<ManagingPage />} />
      <Route path="/myroom" element={<MyRoomPage />} />
      <Route path="/samepose/:roomId" element={<SamePosePage />} />
      <Route path="/silentscream/:roomId" element={<SilentScreamPage />} />
      <Route path="/sketchrelay/:roomId" element={<SketchRelayPage />} />
      {/* <Route path="/sketchrelay-vidu" element={<SketchRelayPage_VIDU />} /> */}
      <Route path="/waiting/:roomId" element={<WaitingPage />} />
    </Routes>
  );
};

export default Router;
