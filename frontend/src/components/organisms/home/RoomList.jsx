// src/components/organisms/home/RoomList.jsx
import RoomCard from "../../molecules/home/RoomCard";
import RoomPasswordModal from "../../organisms/home/RoomPasswordModal";
import GameTab from "../../molecules/home/GameTab";
import Pagination from "../../molecules/home/Pagination";
import { useState, useMemo } from "react";
import { emitJoinRoom } from "../../../sockets/home/emit";

const RoomList = ({ roomList, keyword }) => {
  console.log("전달된 roomList", roomList);
  const [secureRoom, setSecureRoom] = useState(null);
  const [roomPasswordModalOpen, setRoomPasswordModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 4;

  // 비밀번호 모달
  const handlePasswordRequest = (room) => {
    setSecureRoom(room);
    setRoomPasswordModalOpen(true);
  }

  const handlePasswordSubmit = (roomPw) => {
    emitJoinRoom({
      roomId: secureRoom.roomId,
      gameType: secureRoom.gameType,
      roomPw: roomPw,
    });
    setRoomPasswordModalOpen(false);
    setSecureRoom(null);
  }


  // 필터링된 방 리스트
  const filteredRooms = useMemo(() => {
    if (keyword) {
      return roomList.filter((room) => room.roomTitle.toLowerCase().includes(keyword.toLowerCase()));
    }
    if (activeTab === "all") return roomList;
    if (activeTab === "waiting") {
      return roomList.filter((room) => room.teamInfo?.total < 6);
    }
    return roomList.filter((room) => room.gameType?.toLowerCase() === activeTab);
  }, [roomList, activeTab, keyword]);

  const totalPages = Math.ceil(filteredRooms.length / itemsPerPage);
  const paginatedRooms = filteredRooms.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setCurrentPage(1);
  };

  return (
    <div className="flex flex-col items-center">
      {/* 게임 탭 */}
      <div className="w-[1000px] flex justify-center">
        <GameTab activeTab={activeTab} onChange={handleTabChange} />
      </div>

      {/* 방 리스트 */}
      <div className="w-[1000px] flex justify-center">
        <div className="w-full bg-[#F4C0C0] px-18 py-16 h-[750px] flex flex-col justify-between">
          <div className="grid grid-cols-2 gap-10 place-items-center">
            {paginatedRooms.map((room) => (
              <RoomCard
                key={room.roomId}
                room={room}
                participantCount={room.teamInfo?.total}
                onPasswordRequest={handlePasswordRequest}
              />
            ))}
          </div>

          {/* 페이지네이션 */}
          <Pagination
            currentPage={currentPage}
            setCurrentPage={setCurrentPage}
            totalPages={totalPages}
            className="mt-16"
          />
        </div>
      </div>

      {/* 비밀번호 모달 */}
      <RoomPasswordModal
        isOpen={roomPasswordModalOpen}
        onClose={() => setRoomPasswordModalOpen(false)}
        room={secureRoom}
        onSubmit={handlePasswordSubmit}
      />
    </div>
  );
};

export default RoomList;
