import {useState} from "react";
import RightButton from "../../atoms/button/RightButton";
import BasicModal from "../../atoms/modal/BasicModal";
import FriendInviteModal from "./FriendInviteModal";

const FriendInviteButton = ({
    roomId,
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const openModal = () => setIsOpen(true);
    const closeModal = () => setIsOpen(false);

    return (
        <>
            <RightButton onClick={openModal} className="w-36 bg-[#FDE1F0] border border-pink-300">친구 초대</RightButton>
            
           <BasicModal isOpen={isOpen} onClose={closeModal} backgroundPoacity="opacity-100">
                <FriendInviteModal roomId={roomId} onClose={closeModal}/>
            </BasicModal>
        </>
    );
};

export default FriendInviteButton;