// src/pages/LogInPage.jsx
import LogInModal from "../components/organisms/login/LogInModal";
import SignUpModal from "../components/organisms/login/SignUpModal"
import FindPasswordModal from "../components/organisms/login/FindPasswordModal";
import backgroundLogIn from "../assets/background/background_login.png"
import TitleLogo from "../assets/icon/title_logo.png"
import { useState } from "react";

const LogInPage = () => {
    const [showLogin, setShowLogin] = useState(true);
    const [showSignUp, setShowSignUp] = useState(false);
    const [showFindPassword, setShowFindPassword] = useState(false);

    return (
      <div className="relative w-full h-screen overflow-hidden">
        {/* 배경 이미지 */}
        <img
          src={backgroundLogIn}
          alt="login background"
          className="absolute top-0 left-0 w-full h-full object-cover -z-10"
        />

        {/* 로고 */}
        <img
          src={TitleLogo}
          alt="titlelogo"
          className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-250 animate-bounce"
        />
  
        {/* 모달 */}
        <LogInModal
          isOpen={showLogin}
          onClose={() => setShowLogin(false)}
          onOpenSignUp={() => {setShowSignUp(true); setShowLogin(false)}}
          onOpenFindPassword={() => {setShowFindPassword(true); setShowLogin(false)}}
        />
        <SignUpModal
          isOpen={showSignUp}
          onClose={() => setShowSignUp(false)}
          onOpenLogIn={() => {setShowLogin(true); setShowSignUp(false)}}
        />
        <FindPasswordModal
          isOpen={showFindPassword}
          onClose={() => setShowFindPassword(false)}
          onOpenLogIn={() => {setShowLogin(true); setShowFindPassword(false)}}
        />
      </div>
    );
  };

export default LogInPage;
