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

      newAudio
        .play()
        .then(() => {
          setAudio(newAudio);
          setStoreStarted(true);
          setStarted(true);
        })
        .catch((err) => {
          console.warn("🎵 새로고침 후 음악 재생 실패:", err);
          setStoreStarted(false);
          setStarted(false);
        });
    } else if (!storeStarted) {
      setStoreStarted(false);
      setStarted(false);
    }
  }, [storeStarted, currentSrc, audio, setAudio]);

  // 로그인 모달 열기 + 음악 재생
  const handleStart = () => {
    const newAudio = new Audio(mainTheme); // themesong1
    newAudio.loop = true;
    newAudio.volume = 0.3;

    newAudio
      .play()
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

      {!started && (
        <div className="absolute bottom-55 left-1/2 transform -translate-x-1/2">
          <ModalButton size="xl" onClick={handleStart}>
            START
          </ModalButton>
        </div>
      )}
      <p className="absolute bottom-30 left-1/2 transform -translate-x-1/2 text-white text-2xl">
        <b>F11</b> 을 눌러 전체화면 사용을 권장합니다
      </p>
      <p
        className="absolute bottom-10 left-1/2 transform -translate-x-1/2 
               text-black text-xl text-center whitespace-pre-line w-[300px] leading-tight"
      >
        본 게임은 사용자의 캠 화면을{"\n"} 이용하여 초상권을{"\n"} 침해할 수
        있습니다
      </p>

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
