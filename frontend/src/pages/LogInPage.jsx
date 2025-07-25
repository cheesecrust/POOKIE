// src/pages/LogInPage.jsx
import LogInModal from "../components/organisms/login/LogInModal";
import backgroundLogIn from "../assets/background/background_login.png"
import { useState } from "react";

const LogInPage = () => {
    const [isOpen, setIsOpen] = useState(true);

    return (
      <div className="relative w-full h-screen overflow-hidden">
        {/* 배경 이미지 */}
        <img
          src={backgroundLogIn}
          alt="login background"
          className="absolute top-0 left-0 w-full h-full object-cover -z-10"
        />
  
        {/* 모달 */}
        <LogInModal isOpen={isOpen} onClose={() => setIsOpen(false)} />
      </div>
    );
  };
  
  export default LogInPage;
