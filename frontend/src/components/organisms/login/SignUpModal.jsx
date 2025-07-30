// src/components/organisms/login/SignUpModal.jsx
import useAuthStore from "../../../store/store";
import BasicModal from "../../atoms/modal/BasicModal";
import BasicInput from "../../atoms/input/BasicInput";
import ModalButton from "../../atoms/button/ModalButton";
import SocialButton from "../../atoms/button/SocialButton";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { connectSocket, closeSocket } from "../../../sockets/common/websocket"

const SignUpModal = ({ isOpen, onClose }) => {
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
    }

    const handleSignUp = async () => {
        setError("");
        setSuccess(false);

        if (password !== passwordConfirm) {
            setError("비밀번호가 일치하지 않습니다.")
            return
        }

        console.log('가입 시도:', { email, password, nickname })
        const res = await signup({
            email: email,
            password: password,
            nickname: nickname,
        });
        console.log('가입 결과:', res)

        // 회원가입 성공 시, 자동 로그인
        if (res?.success) {
            setSuccess(true)
            const currentUser = useAuthStore.getState().user;
            const accessToken = useAuthStore.getState().accessToken;
            
            console.log('현재 로그인 유저:', currentUser?.nickname)
            
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
            onClose();
            navigate('/home'); // 홈으로 리디렉션
        } else {
            setError(`회원가입 실패: ${res.message}`)
        }
    }

    return (
        <BasicModal
            isOpen={isOpen}
            onClose={onClose}
            className="w-[550px] min-h-[500px]"
            closeBackdropClick={false}
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
                    <SocialButton provider="google" className="w-[180px]"/>
                    <SocialButton provider="kakao" className="w-[180px]"/>
                </div>
            </div>
        </BasicModal>
      )
    }

export default SignUpModal
