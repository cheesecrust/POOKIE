// 푸키푸키버튼 + 친구/쪽지 모달 연동
// 푸키푸키버튼 누를때 모달 열리고 닫힘
// <FriendMessageWrapper /> 로 상위 컴포넌트에서 import 해서 사용하시면됨


import { useState } from "react";
import PookieButton from "../../atoms/button/PookieButton";
import FriendMessageModal from "./FriendMessageModal";

const FriendMessageWrapper = () => {
  // 모달 상태 관리
  const [isModalOpen, setIsModalOpen] = useState(false);

  // 버튼 클릭 시 모달 열고 닫기
  const handleToggleModal = () => {
    setIsModalOpen(prev => !prev);
  };

  return (
    <>
      {/* Pookie 버튼 */}
      <div className="fixed bottom-6 right-6 z-50">
        <PookieButton onClick={handleToggleModal} />
      </div>

      {/* 모달 */}
      {isModalOpen && (
        <div
          className="fixed inset-0 flex justify-center items-center z-40 bg-transparent"
        >
          <div>
            <FriendMessageModal />
          </div>
        </div>
      )}
    </>
  );
};

export default FriendMessageWrapper;
