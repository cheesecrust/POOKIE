// src/components/organisms/login/RoomPasswordModal.jsx
import BasicModal from "../../atoms/modal/BasicModal";
import BasicInput from "../../atoms/input/BasicInput";
import ModalButton from "../../atoms/button/ModalButton";
import { useState, useEffect } from "react";

const RoomPasswordModal = ({ isOpen, onClose, onSubmit }) => {
    const [password, setPassword] = useState("");

    useEffect(() => {
        if (isOpen) setPassword("");
    }, [isOpen]);

    const handleSubmit = () => {
        onSubmit(password);
    }

    const handleKeyDown = (e) => {
        if (e.key === "Enter") {
            handleSubmit();
        }
    }
    return (
        <BasicModal
            isOpen={isOpen}
            onClose={onClose}
            className="w-[550px] h-[250px]"
        >
            <h2 className="text-center text-xl font-bold mt-4 mb-8">비밀번호를 입력하세요.</h2>
    
            {/* 입력 필드 */}
            <div className="flex flex-col gap-3 w-full mt-2 mb-6 items-center">
                {/* 비밀번호 */}
                <div className="flex items-center gap-4">
                    <BasicInput
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        onKeyDown={handleKeyDown}
                        className="w-[300px] rounded-full"
                    />
                </div>
            </div>
    
            {/* 입력 버튼 */}
            <div className="w-full mb-4 flex justify-center">
              <ModalButton onClick={handleSubmit} className="">
                입장
              </ModalButton>
            </div>
        </BasicModal>
      )
    }

export default RoomPasswordModal
