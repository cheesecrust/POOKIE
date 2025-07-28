// src/components/organisms/login/RoomPasswordModal.jsx
import BasicModal from "../../atoms/modal/BasicModal";
import BasicInput from "../../atoms/input/BasicInput";
import ModalButton from "../../atoms/button/ModalButton";
import Radio from "../../atoms/radio/Radio"
import { useState } from "react";

const RoomCreateModal = ({ isOpen, onClose }) => {
    const [roomTitle, setRoomTitle] = useState("");
    const [gameType, setGameType] = useState("");
    const [usePassword, setUsePassword] = useState(false);
    const [roomPassword, setRoomPassword] = useState("");

    const handleKeyDown = (e) => {
        if (e.key === "Enter") {
            handleRoomCreate();
        }
    }

    const handleRoomCreate = () => {
        const payload = {
            title: roomTitle,
            gameType,
            password: usePassword ? roomPassword : null,
        };
        console.log("방 생성 완료!", payload);
        // 여기에 API 요청 or 상위 전달
    };

  return (
    <BasicModal isOpen={isOpen} onClose={onClose} className="w-[550px] h-[480px]">

      <h2 className="text-center text-2xl font-bold mt-4 mb-8">방 생성하기</h2>
      <div className="flex flex-col gap-5 w-full mt-2 mb-8 items-center">

        {/* 방 제목 */}
        <div className="flex items-center gap-4">
          <label className="text-base font-bold text-black w-[100px] text-right">
            방 제목
          </label>
          <BasicInput
            value={roomTitle}
            onChange={(e) => setRoomTitle(e.target.value)}
            onKeyDown={handleKeyDown}
            className="w-[300px] h-[50px] rounded-full"
          />
        </div>

        {/* 게임 선택 */}
        <div className="flex items-center gap-4">
          <label className="text-base font-bold text-black w-[100px] text-right">
            게임 선택
          </label>
          <div className="flex flex-col gap-2">

            {/* 1행: 일심동체 + 그림그리기 */}
            <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                    <Radio
                    value="samepose"
                    selectedValue={gameType}
                    onChange={setGameType}
                    />
                    <span className="text-sm font-bold text-black">일심동체</span>
                </div>

                <div className="flex items-center gap-2">
                    <Radio
                    value="sketchrelay"
                    selectedValue={gameType}
                    onChange={setGameType}
                    />
                    <span className="text-sm font-bold text-black">그림그리기</span>
                </div>
            </div>

            {/* 2행: 고요 속의 외침 */}
            <div className="flex items-center gap-2">
                <Radio
                value="silentscream"
                selectedValue={gameType}
                onChange={setGameType}
                />
                <span className="text-sm font-bold text-black">고요 속의 외침</span>
            </div>
        </div>
        </div>

        {/* 비밀번호 사용 여부 */}
        <div className="flex items-center gap-4">
            <label className="text-base font-bold text-black w-[100px] text-right">
            비밀번호
            </label>

            <div className="flex items-center gap-2">
                <Radio
                    checked={usePassword}
                    onChange={setUsePassword}
                />

                {/* 비밀번호 입력칸 (활성화 시에만) */}
                {usePassword && (
                    <BasicInput
                    type="password"
                    value={roomPassword}
                    onChange={(e) => setRoomPassword(e.target.value)}
                    placeholder="숫자로 비밀번호"
                    onKeyDown={handleKeyDown}
                    className="w-[200px] h-[50px] rounded-full ml-2 text-xl"
                    />
                )}
            </div>
        </div>
    </div>

      {/* 생성 완료 버튼 */}
      <div className="w-full mb-4 flex justify-center">
        <ModalButton onClick={handleRoomCreate}>방 생성 완료</ModalButton>
      </div>
    </BasicModal>
    );
};

export default RoomCreateModal;
