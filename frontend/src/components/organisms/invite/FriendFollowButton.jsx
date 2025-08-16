// 친구 초대 버튼 (대기실 버튼 클릭시 모달 뜸뜸)
import {useState} from "react";
import ModalButton from "../../atoms/button/ModalButton";
import FriendFollowModal from "./FriendFollowModal";
import BasicModal from "../../atoms/modal/BasicModal";

const FriendFollowButton = () => {
    const [isOpen, setIsOpen] = useState(false);
    const openModal = () => setIsOpen(true);
    const closeModal = () => setIsOpen(false);

    return (
        <>
            <ModalButton
                onClick={openModal}
                className="px-6 py-2 rounded-full shadow-md hover:brightness-95"
            >
                따라가기
            </ModalButton>

            {/* 친구 따라가기 모달 */}
            <BasicModal isOpen={isOpen} onClose={closeModal} backgroundPoacity="opacity-100">
                <FriendFollowModal onClose={closeModal}/>
            </BasicModal>
        </>
    );
};

export default FriendFollowButton;