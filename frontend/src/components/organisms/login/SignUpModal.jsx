// src/components/organisms/login/SignUpModal.jsx
import BasicModal from "../../atoms/modal/BasicModal";
import BasicInput from "../../atoms/input/BasicInput";
import ModalButton from "../../atoms/button/ModalButton";
import SocialButton from "../../atoms/button/SocialButton";
import { useState } from "react";

const SignUpModal = ({ isOpen, onClose }) => {
    const [id, setId] = useState("");
    const [pw, setPw] = useState("");
    const [pwconfirm, setPwconfirm] = useState("");

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
            className="w-[550px] min-h-[500px]"
        >
            <h2 className="text-center text-2xl font-bold mt-4 mb-8">회원가입</h2>
    
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
                {/* 비밀번호 확인*/}
                <div className="flex items-center gap-4">
                    <label className="text-base font-bold text-black w-[100px] text-right whitespace-nowrap">
                        비밀번호 확인
                    </label>
                    <BasicInput
                        value={pwconfirm}
                        type="password"
                        onChange={(e) => setPwconfirm(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="비밀번호 확인"
                        className="w-[300px]"
                    />
                </div>
            </div>

            <div className="flex flex-col items-center gap-y-8 mt-10">
            {/* 소셜 로그인 버튼 */}
                <div className="flex gap-2 justify-center">
                    <SocialButton provider="google" className="w-[180px]"/>
                    <SocialButton provider="kakao" className="w-[180px]"/>
                </div>

    
            {/* 회원가입 버튼 */}

                <div className="w-full flex justify-center">
                  <ModalButton onClick={handleSignUp} className="">
                    회원가입
                  </ModalButton>
                </div>
            </div>
    
        </BasicModal>
      )
    }

export default SignUpModal
