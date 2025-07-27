// src/components/organisms/modal/RoomExitModal.jsx

import BasicModal from "../../atoms/modal/BasicModal";
import ModalButton from "../../atoms/button/ModalButton";

const RoomExitModal = ({ isOpen, onConfirm, onCancel }) => {
  return (
    <BasicModal
      isOpen={isOpen}
      onClose={onCancel}
      className="w-[360px] bg-[#F5D5E0]"
    >
      <div className="flex flex-col items-center justify-center h-full space-y-6 text-center">
        {/* 타이틀 */}
        <h2 className="text-2xl text-black">방 나가기</h2>

        {/* 본문 문구 */}
        <p className="text-sm text-black">정말로 나가시겠습니까?</p>

        {/* 버튼들 */}
        <div className="flex space-x-4">
          <ModalButton onClick={onConfirm} variant="confirm">
            네
          </ModalButton>
          <ModalButton onClick={onCancel} variant="cancel">
            아니요
          </ModalButton>
        </div>
      </div>
    </BasicModal>
  );
};

export default RoomExitModal;
