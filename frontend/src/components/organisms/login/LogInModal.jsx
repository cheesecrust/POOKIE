// src/components/organisms/login/LogInModal.jsx
import BasicModal from "../../atoms/modal/BasicModal";
import BasicInput from "../../atoms/input/BasicInput";
import ModalButton from "../../atoms/button/ModalButton";
import SocialButton from "../../atoms/button/SocialButton";
import toggleLeft from "../../../assets/icon/toggle_left.png"
import { useState } from "react";

const LogInModal = ({ isOpen, onClose }) => {
    const [id, setId] = useState("");
    const [pw, setPw] = useState("");

    const handleKeyDown = (e) => {
        if (e.key === "Enter") {
            handleLogin();
        }
    }
    const handleLogin = () => {
        console.log("로그인!", { id, pw });
    }
    return (
        <BasicModal
            isOpen={isOpen}
            onClose={onClose}
            className="w-[550px] h-[420px]"
        >
            <h2 className="text-center text-2xl font-bold mt-4 mb-8">로그인</h2>
    
            {/* 입력 필드 */}
            <div className="flex flex-col gap-3 w-full mt-2 mb-4 items-center">
                {/* 아이디 */}
                <div className="flex items-center gap-4">
                    <label className="text-base font-bold text-black w-[100px] text-right">
                        아이디
                    </label>
                    <BasicInput
                        value={id}
                        onChange={(e) => setId(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="아이디"
                        className="w-[300px]"
                    />
                </div>
                {/* 비밀번호 */}
                <div className="flex items-center gap-4">
                    <label className="text-base font-bold text-black w-[100px] text-right">
                        비밀번호
                    </label>
                    <BasicInput
                        value={pw}
                        type="password"
                        onChange={(e) => setPw(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="비밀번호"
                        className="w-[300px]"
                    />
                </div>
            </div>
    
            {/* 로그인 버튼 */}
            <div className="w-full mb-4 flex justify-center">
              <ModalButton onClick={handleLogin} className="">
                로그인
              </ModalButton>
            </div>
    
            {/* 소셜 로그인 버튼 */}
            <div className="flex gap-2 mb-5 justify-center">
              <SocialButton provider="google" className="w-[200px]"/>
              <SocialButton provider="kakao" className="w-[200px]"/>
            </div>
    
            {/* 하단 텍스트 */}
            <div className="flex flex-col items-end text-xs font-bold mr-12 gap-y-2">
                <div className="flex items-center gap-1 hover:underline cursor-pointer">
                    <img src={toggleLeft} alt="화살표" className="w-3 h-3 mr-1" />
                    <a href="#">회원가입</a>
                </div>
                <div className="flex items-center gap-1 hover:underline cursor-pointer">
                    <img src={toggleLeft} alt="화살표" className="w-3 h-3" />
                    <a href="#">비밀번호를 잊어버리셨나요?</a>
                </div>
            </div>
        </BasicModal>
      )
    }

export default LogInModal
