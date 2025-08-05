// src/components/organisms/KickNoticeModal.jsx

import BasicModal from "../../atoms/modal/BasicModal";

const KickNoticeModal = () => {
  return (
    <BasicModal
      isOpen={true}
      onClose={() => {}}
      className="w-[320px] bg-white rounded-xl shadow-lg px-6 py-6"
    >
      <div className="flex flex-col items-center justify-center space-y-4 text-center font-[pixel]">
        <h2 className="text-2xl text-rose-500 font-bold">강퇴</h2>
        <p className="text-sm text-gray-800">
          방장에 의해 강제 퇴장 당했습니다
        </p>
      </div>
    </BasicModal>
  );
};

export default KickNoticeModal;
