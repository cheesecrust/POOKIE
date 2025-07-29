// src/components/organisms/home/RoomList.jsx
import RoomCard from "../../molecules/home/RoomCard";
import GameTab from "../../molecules/home/GameTab";
import Pagination from "../../molecules/home/Pagination";
import { useState, useMemo } from "react";

const RoomList = ({ roomList, keyword }) => {
  const [activeTab, setActiveTab] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 4;

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
    <div className="min-h-screen flex flex-col items-center">
      {/* 게임 탭 */}
      <div className="w-[900px] flex justify-center">
        <GameTab activeTab={activeTab} onChange={handleTabChange} />
      </div>

      {/* 방 리스트 */}
      <div className="w-[900px] flex justify-center">
        <div className="w-full bg-[#F4C0C0] px-16 py-10">
          <div className="grid grid-cols-2 gap-10 place-items-center">
            {paginatedRooms.map((room) => (
              <RoomCard
                key={room.roomId}
                room={room}
                participantCount={room.teamInfo?.total}
              />
            ))}
          </div>

          {/* 페이지네이션 */}
          <Pagination
            currentPage={currentPage}
            setCurrentPage={setCurrentPage}
            totalPages={totalPages}
            className="mt-14"
          />
        </div>
      </div>
    </div>
  );
};

export default RoomList;
