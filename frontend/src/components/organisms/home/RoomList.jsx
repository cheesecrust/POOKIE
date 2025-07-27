// src/components/organisms/home/RoomList.jsx
import RoomCard from "../../molecules/home/RoomCard";
import GameTab from "../../molecules/home/GameTab";
import Pagination from "../../molecules/home/Pagination";
import { useState, useMemo } from "react";

// 더미 데이터
const dummyRooms = [
    { id: 1, title: "room_title", type: "samepose", participants: 5 },
    { id: 2, title: "room_title", type: "sketchrelay", participants: 5 },
    { id: 3, title: "room_title", type: "sketchrelay", participants: 5 },
    { id: 4, title: "room_title", type: "silentscream", participants: 5 },
    { id: 5, title: "room_title", type: "samepose", participants: 5 },
    { id: 6, title: "room_title", type: "silentscream", participants: 5 },
    { id: 7, title: "room_title", type: "samepose", participants: 5 },
    { id: 8, title: "room_title", type: "sketchrelay", participants: 5 },
    { id: 9, title: "room_title", type: "silentscream", participants: 5 },
    { id: 10, title: "room_title", type: "samepose", participants: 5 },
  ];
  
  const itemsPerPage = 4;
  
  const RoomList = () => {
    const [activeTab, setActiveTab] = useState("all");
    const [currentPage, setCurrentPage] = useState(1);
  
    // 필터링
    const filteredRooms = useMemo(() => {
      if (activeTab === "all") return dummyRooms;
      if (activeTab === "waiting") {
        return dummyRooms.filter((room) => room.participants < 6);
      }
      return dummyRooms.filter((room) => room.type === activeTab);
    }, [activeTab]);
  
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
                        key={room.id}
                        roomTitle={room.title}
                        roomType={room.type}
                        participantCount={room.participants}
                        onClick={() => console.log(`${room.title} 입장`)}
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