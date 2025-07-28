// src/components/organisms/login/FindPasswordModal.jsx
import BasicModal from "../../atoms/modal/BasicModal";
import BasicInput from "../../atoms/input/BasicInput";
import ModalButton from "../../atoms/button/ModalButton";
import { useState } from "react";

const FindPasswordModal = ({ isOpen, onClose }) => {
    const [id, setId] = useState("");

    const handleKeyDown = (e) => {
        if (e.key === "Enter") {
            handleLogin();
        }
    }
    const handleLogin = () => {
        console.log("비밀번호 찾기!", { id });
    }
    return (
        <BasicModal
            isOpen={isOpen}
            onClose={onClose}
            className="w-[550px] h-[250px]"
        >
            <h2 className="text-center text-2xl font-bold mt-4 mb-8">비밀번호 찾기</h2>
    
            {/* 입력 필드 */}
            <div className="flex flex-col gap-3 w-full mt-2 mb-6 items-center">
                {/* 아이디 */}
                <div className="flex items-center gap-4">
                    <label className="text-base font-bold text-black w-[100px] text-right">
                        아이디 입력
                    </label>
                    <BasicInput
                        value={id}
                        onChange={(e) => setId(e.target.value)}
                        onKeyDown={handleKeyDown}
                        className="w-[300px]"
                    />
                </div>
            </div>
    
            {/* 로그인 버튼 */}
            <div className="w-full mb-4 flex justify-center">
              <ModalButton onClick={handleLogin} className="">
                찾기
              </ModalButton>
            </div>
        </BasicModal>
      )
    }

export default FindPasswordModal
