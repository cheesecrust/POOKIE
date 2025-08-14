// src/components/organisms/login/SignUpModal.jsx
import useAuthStore from "../../../store/useAuthStore";
import BasicModal from "../../atoms/modal/BasicModal";
import BasicInput from "../../atoms/input/BasicInput";
import ModalButton from "../../atoms/button/ModalButton";
import SocialButton from "../../atoms/button/SocialButton";
import toggleLeft from "../../../assets/icon/toggle_left.png";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

const SignUpModal = ({ isOpen, onClose, onOpenLogIn }) => {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [nickname, setNickname] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const { signup, user } = useAuthStore();

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      handleSignUp();
    }
  };

  const handleSignUp = async () => {
    if (password !== passwordConfirm) {
      alert("비밀번호가 일치하지 않습니다🥲");
      return;
    }
    
    const res = await signup({
      email,
      password,
      nickname,
    });
    
    const errMsg = res.message.includes(":")
      ? res.message.split(":")[1].trim()
      : res.message;
    
    // 회원가입 성공 시, 자동 로그인
    if (res?.success) {
      navigate("/home"); // 홈으로 리디렉션
      return;
    } else {
      alert(`${errMsg}🥲`);
    }
  };

  return (
    <BasicModal
      isOpen={isOpen}
      onClose={onClose}
      className="w-[550px] min-h-[500px]"
      closeBackdropClick={false}
      backgroundPoacity="opacity-90"
    >
      <h2 className="text-center text-2xl font-bold mt-4 mb-8">회원가입</h2>

      {/* 입력 필드 */}
      <div className="flex flex-col gap-4 w-full mt-2 mb-4 items-center">
        {/* 아이디 */}
        <div className="flex items-center gap-4">
          <label className="text-base font-bold text-black w-[100px] text-right">
            아이디
          </label>
          <BasicInput
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="pookie@example.com"
            className="w-[300px] h-[40px]"
          />
        </div>
        {/* 닉네임 */}
        <div className="flex items-center gap-4">
          <label className="text-base font-bold text-black w-[100px] text-right">
            닉네임
          </label>
          <BasicInput
            value={nickname}
            type="text"
            onChange={(e) => setNickname(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="이름 혹은 별명"
            className="w-[300px] h-[40px]"
          />
        </div>
        {/* 비밀번호 */}
        <div className="flex items-center gap-4">
          <label className="text-base font-bold text-black w-[100px] text-right">
            비밀번호
          </label>
          <BasicInput
            value={password}
            type="password"
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={handleKeyDown}
            className="w-[300px] h-[40px]"
          />
        </div>
        {/* 비밀번호 확인*/}
        <div className="flex items-center gap-4">
          <label className="text-base font-bold text-black w-[100px] text-right whitespace-nowrap">
            비밀번호 확인
          </label>
          <BasicInput
            value={passwordConfirm}
            type="password"
            onChange={(e) => setPasswordConfirm(e.target.value)}
            onKeyDown={handleKeyDown}
            className="w-[300px] h-[40px]"
          />
        </div>
      </div>

      <div className="flex flex-col items-center gap-y-6 mt-8">
        {/* 회원가입 버튼 */}
        <div className="w-full flex justify-center">
          <ModalButton onClick={handleSignUp} className="">
            회원가입
          </ModalButton>
        </div>
        {/* 소셜 로그인 버튼 */}
        <div className="flex gap-2 justify-center">
          <SocialButton provider="google" className="w-[180px]" />
          <SocialButton provider="kakao" className="w-[180px]" />
        </div>

        <div className="flex justify-end text-xs font-bold mr-12 gap-y-2 w-[450px]">
          <div
            className="flex items-center gap-1 hover:underline cursor-pointer"
            onClick={onOpenLogIn}
          >
            <img src={toggleLeft} alt="화살표" className="w-3 h-3 mr-1" />
            <span>로그인 페이지로 이동</span>
          </div>
        </div>
      </div>
    </BasicModal>
  );
};

export default SignUpModal;
