// src/components/organisms/KickNoticeModal.jsx

import BasicModal from "../../atoms/modal/BasicModal";

const KickNoticeModal = () => {
  return (
    <BasicModal
      isOpen={true}
      onClose={() => {}} // 닫기 버튼 없으므로 noop
      className="w-[360px] h-[200px] bg-white rounded-xl shadow-lg"
    >
      <div className="flex flex-col items-center justify-center h-full space-y-4 text-center font-[pixel]">
        <h2 className="text-2xl text-red-600 font-bold">강퇴</h2>
        <p className="text-sm text-gray-800">방장에 의해 강제 퇴장당했습니다</p>
      </div>
    </BasicModal>
  );
};

export default KickNoticeModal;
