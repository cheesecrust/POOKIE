import FriendMessageModal from "../components/organisms/common/FriendMessageModal";
import background_myroom from "../assets/background/background_myroom.png";

const MyRoomPage = () => {
  return (
    <div className="relative w-full h-screen overflow-hidden">
      {/* 배경 이미지는 absolute로 완전 뒤로 보내야 함 */}
      <img
        src={background_myroom}
        alt="background_myroom"
        className="absolute top-0 left-0 w-full h-full object-cover -z-10"
      />
    
    <div className="flex justify-center items-start min-h-screen pt-20">
      <FriendMessageModal />
    </div>
    </div>
  );
};


export default MyRoomPage;
