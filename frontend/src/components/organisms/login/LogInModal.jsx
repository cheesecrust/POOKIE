// src/components/organisms/login/LogInModal.jsx
import BasicModal from "../../atoms/modal/BasicModal";
import BasicInput from "../../atoms/input/BasicInput";
import ModalButton from "../../atoms/button/ModalButton";
import SocialButton from "../../atoms/button/SocialButton";
import toggleLeft from "../../../assets/icon/toggle_left.png"
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import useAuthStore from "../../../store/useAuthStore";

const LogInModal = ({ isOpen, onClose, onOpenSignUp, onOpenFindPassword }) => {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const login = useAuthStore((state) => state.login);
    
    const navigate = useNavigate();
    
    const handleKeyDown = (e) => {
        if (e.key === "Enter") {
            handleLogin();
        }
    }
    const handleLogin = async () => {
        const res = await login({ email, password, navigate });

        if (res.success) {

            const { user, accessToken } = useAuthStore.getState()

            if (!user || !accessToken) {
                alert('로그인 정보를 찾을 수 없습니다.')
                return
            }

            console.log('현재 로그인 유저:', user)
            onClose();
            navigate('/home'); // 홈으로 리디렉션
        } else {
            alert("등록되지 않은 이메일 또는 비밀번호가 틀렸습니다.")
        }
    }
    
    return (
        <BasicModal
            isOpen={isOpen}
            onClose={onClose}
            className="w-[550px] h-[420px]"
            closeBackdropClick={false}
            backgroundPoacity="opacity-90"
        >
            <h2 className="text-center text-2xl font-bold mt-4 mb-8">로그인</h2>
    
            {/* 입력 필드 */}
            <div className="flex flex-col gap-3 w-full mt-2 mb-6 items-center">
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
                        placeholder="비밀번호"
                        className="w-[300px] h-[40px]"
                    />
                </div>
            </div>
    
            {/* 로그인 버튼 */}
            <div className="w-full mb-6 flex justify-center">
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
                <div
                    className="flex items-center gap-1 hover:underline cursor-pointer"
                    onClick={onOpenSignUp}
                >
                    <img src={toggleLeft} alt="화살표" className="w-3 h-3 mr-1" />
                    <span>회원가입</span>
                </div>
                <div
                    className="flex items-center gap-1 hover:underline cursor-pointer"
                    onClick={onOpenFindPassword}
                >
                    <img src={toggleLeft} alt="화살표" className="w-3 h-3" />
                    <span>비밀번호를 잊어버리셨나요?</span>
                </div>
            </div>
        </BasicModal>
      )
    }

export default LogInModal
