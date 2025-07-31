// 강퇴 확인 모달
// src/components/organisms/waiting/KickConfirmModal.jsx

import BasicModal from "../../atoms/modal/BasicModal";
import ModalButton from "../../atoms/button/ModalButton";

const KickConfirmModal = ({ isOpen, targetUser, onConfirm, onCancel }) => {
  return (
    <BasicModal
      isOpen={isOpen}
      onClose={onCancel}
      className="w-[360px] h-[180px] bg-pink-200 rounded-lg"
    >
      <div className="flex flex-col items-center justify-center h-full space-y-6 text-center font-[pixel]">
        {/* 제목 */}
        <h2 className="text-2xl font-bold text-black">강퇴하기</h2>

        {/* 본문 문구 */}
        <p className="text-sm text-black">
          <span className="font-semibold text-lg text-black">
            {targetUser?.userNickname}
          </span>
          님을 강퇴시키겠습니까?
        </p>

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

export default KickConfirmModal;
