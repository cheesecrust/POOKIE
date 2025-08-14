// src/components/organisms/invite/InviteModal.jsx
import useHomeStore from "../../../store/useHomeStore";
import BasicModal from "../../atoms/modal/BasicModal";
import RightButton from "../../atoms/button/RightButton";

const InviteModal = () => {

  const inviteGate = useHomeStore((state) => state.inviteGate);
  const invite = useHomeStore((state) => state.invite);
  const closeInvite = useHomeStore((state) => state.closeInvite);
  const acceptInvite = useHomeStore((state) => state.acceptInvite);

  const open = inviteGate && !!invite?.open;
  const data = invite?.data || {};

  // 초대한 친구 닉네임 
  const inviteUser = data.inviteUser;
  
  console.log("data", data);
  console.log("invite", invite);
  
  if (!inviteGate) return null; //
  
  return (
    <BasicModal isOpen={open} onClose={closeInvite}>
      <div className="w-[340px] max-w-[92vw]">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-xl font-bold">게임 초대</h2>
          <button
            onClick={closeInvite}
            className="text-xl leading-none hover:opacity-70"
            aria-label="닫기"
          >
            ×
          </button>
        </div>

        <div className="rounded-md border-2 border-black bg-[#FDE1F0] p-5 text-center">
          <p className="text-lg font-bold mb-4">
            {inviteUser} 님이 게임 초대했습니다!
          </p>

          <div className="mt-1 flex justify-center gap-2">
            <RightButton onClick={acceptInvite}>수락</RightButton>
            <RightButton
              onClick={closeInvite}
              className="bg-white border-black hover:bg-gray-100"
            >
              거절
            </RightButton>
          </div>
        </div>
      </div>
    </BasicModal>
  );
};

export default InviteModal;
