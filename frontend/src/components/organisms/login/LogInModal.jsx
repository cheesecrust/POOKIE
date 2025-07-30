// src/components/organisms/login/LogInModal.jsx
import BasicModal from "../../atoms/modal/BasicModal";
import BasicInput from "../../atoms/input/BasicInput";
import ModalButton from "../../atoms/button/ModalButton";
import SocialButton from "../../atoms/button/SocialButton";
import toggleLeft from "../../../assets/icon/toggle_left.png"
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import useAuthStore from "../../../store/store";
import { connectSocket, closeSocket } from "../../../sockets/common/websocket";

const LogInModal = ({ isOpen, onClose, onOpenSignUp, onOpenFindPassword }) => {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const { login } = useAuthStore();
    
    const navigate = useNavigate();
    
    const handleKeyDown = (e) => {
        if (e.key === "Enter") {
            handleLogin();
        }
    }
    const handleLogin = async () => {
        const res = await login({ email: email, password: password });

        if (res.success) {
            alert('로그인 성공!')

            const currentUser = useAuthStore.getState().user;
            const accessToken = useAuthStore.getState().accessToken;

            console.log('현재 로그인 유저:', currentUser)

            // 중복 방지 위해 연결 종료
            closeSocket();
            // websocket 연결 시작
            connectSocket({
                url: import.meta.env.VITE_SOCKET_URL,
                token: accessToken,
                onOpen: (e) => {
                                // 연결 완료 시, 접속 메시지 전송
                },
                // Type: ON 파싱 메시지
                onMessage: (e) => {
                    try {
                      const data = JSON.parse(e.data);
                      console.log("[WebSocket MESSAGE]", data);
                  
                      if (data.type === "ON") {
                        console.log("🟢 유저 연결 성공:", data.user?.userId);
                      } else if (data.type === "ERROR") {
                        console.error("❌ 서버 에러:", data.message);
                      } else {
                        console.log("📦 기타 메시지:", data);
                      }
                    } catch (err) {
                      console.error("[WebSocket MESSAGE ERROR]", err);
                    }
                },                  
                onClose: (e) => {
                    console.log("[WebSocket CLOSE]", e);
                },
                onError: (e) => {
                    console.log("[WebSocket ERROR]", e);
                },
            });
            
            // 모달 닫은 후, 페이지 이동
            onClose();
            navigate('/home'); // 홈으로 리디렉션
        } else {
            alert(`로그인 실패: ${res.message}`)
        }
    }
    
    return (
        <BasicModal
            isOpen={isOpen}
            onClose={onClose}
            className="w-[550px] h-[420px]"
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
