// src/pages/LogInPage.jsx
import ModalButton from "../components/atoms/button/ModalButton";
import LogInModal from "../components/organisms/login/LogInModal";
import SignUpModal from "../components/organisms/login/SignUpModal";
import FindPasswordModal from "../components/organisms/login/FindPasswordModal";
import backgroundLogIn from "../assets/background/background_login.png";
import TitleLogo from "../assets/icon/title_logo.png";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import useAuthStore from "../store/useAuthStore";
import useAudioStore from "../store/useAudioStore";
import mainTheme from "../assets/audio/themesong1.mp3";

// 섹션
import IntroSection from "../sections/IntroSection";
import GamesSection from "../sections/GamesSection";
import MyRoomSection from "../sections/MyRoomSection";
import CharacterSection from "../sections/CharacterSection";
import OutroSection from "../sections/OutroSection";

const LogInPage = () => {
  const navigate = useNavigate();
  const { isLoggedIn } = useAuthStore((state) => state);

  const [started, setStarted] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [showSignUp, setShowSignUp] = useState(false);
  const [showFindPassword, setShowFindPassword] = useState(false);

  const {
    audio,
    currentSrc,
    started: storeStarted,
    setAudio,
    setCurrentSrc,
    setStarted: setStoreStarted,
  } = useAudioStore();

  // ✅ 새로고침 시 자동 음악 재생
  useEffect(() => {
    if (storeStarted && currentSrc && !audio) {
      const newAudio = new Audio(currentSrc);
      newAudio.loop = true;
      newAudio.volume = 0.3;

      newAudio.play()
        .then(() => {
          setAudio(newAudio);
          setStoreStarted(true);
        })
        .catch((err) => {
          console.warn("새로고침 후 음악 재생 실패", err)
          setStoreStarted(false);
        });
    } else if (!storeStarted) {
      setStoreStarted(false);
    }
  }, [storeStarted, currentSrc, audio, setAudio]);

  // 로그인 모달 열기 + 음악 재생
  const handleStart = () => {
    if (audio && !audio.paused) {
      setStoreStarted(true);
      setStarted(true);
      setShowLogin(true);
      return;
    }

    const newAudio = new Audio(mainTheme); // themesong1
    newAudio.loop = true;
    newAudio.volume = 0.3;

    newAudio.play()
      .then(() => {
        if (audio) {
          audio.pause();
          audio.currentTime = 0;
        }
        setAudio(newAudio);
        setCurrentSrc(mainTheme);
        setStoreStarted(true);
        setStarted(true);
        setShowLogin(true); // 로그인 모달 열기
      })
      .catch((err) => {
        console.warn("🎵 음악 재생 실패:", err);
        setStarted(false);
      });
  };

  // 이미 로그인된 유저는는 home 으로 강제 redirect
  useEffect(() => {
    if (isLoggedIn) {
      navigate("/home", { replace: true });
    }
  }, [isLoggedIn, navigate]);

  return (
    // 스크롤 스냅 컨테이너
    <div className="relative w-full h-screen overflow-y-auto overflow-x-hidden snap-y snap-mandatory scroll-smooth">
      {/* 5 섹션: 각 섹션은 내부에서 h-screen 처리됨 */}
      <div className="snap-start">
        <IntroSection />
      </div>
      <div className="snap-start">
        <GamesSection />
      </div>
      <div className="snap-start">
        <MyRoomSection />
      </div>
      <div className="snap-start">
        <CharacterSection />
      </div>
      <div className="snap-start">
        {/* 기존 START 버튼을 Outro에서 재사용 */}
        <OutroSection onStart={handleStart} started={started} />
      </div>

      {/* 모달 */}
      {started && (
        <>
          <LogInModal
            isOpen={showLogin}
            onClose={() => setShowLogin(false)}
            onOpenSignUp={() => {
              setShowSignUp(true);
              setShowLogin(false);
            }}
            onOpenFindPassword={() => {
              setShowFindPassword(true);
              setShowLogin(false);
            }}
          />
          <SignUpModal
            isOpen={showSignUp}
            onClose={() => setShowSignUp(false)}
            onOpenLogIn={() => {
              setShowLogin(true);
              setShowSignUp(false);
            }}
          />
          <FindPasswordModal
            isOpen={showFindPassword}
            onClose={() => setShowFindPassword(false)}
            onOpenLogIn={() => {
              setShowLogin(true);
              setShowFindPassword(false);
            }}
          />
        </>
      )}
    </div>
  );
};

export default LogInPage;
