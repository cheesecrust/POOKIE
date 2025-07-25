// src/components/organisms/login/SignUpModal.jsx
import BasicModal from "../../atoms/modal/BasicModal";
import BasicInput from "../../atoms/input/BasicInput";
import ModalButton from "../../atoms/button/ModalButton";
import SocialButton from "../../atoms/button/SocialButton";
import toggleLeft from "../../../assets/icon/toggle_left.png"
import { useState } from "react";

const SignUpModal = ({ isOpen, onClose }) => {
    const [id, setId] = useState("");
    const [pw, setPw] = useState("");

    const handleKeyDown = (e) => {
        if (e.key === "Enter") {
            handleLogin();
        }
    }
    const handleSignUp = () => {
        console.log("회원가입 완료", { id, pw });
    }
    return (
        <BasicModal
            isOpen={isOpen}
            onClose={onClose}
            className="w-[550px] h-[420px]"
        >
            <h2 className="text-center text-2xl font-bold mt-4 mb-8">회원가입입</h2>
    
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
              <ModalButton onClick={handleSignUp} className="">
                회원가입
              </ModalButton>
            </div>
    
            {/* 소셜 로그인 버튼 */}
            <div className="flex gap-2 mb-5 justify-center">
              <SocialButton provider="google" className="w-[200px]"/>
              <SocialButton provider="kakao" className="w-[200px]"/>
            </div>
        </BasicModal>
      )
    }

export default SignUpModal
