// src/components/organisms/home/RoomList.jsx
import RoomCard from "../../molecules/home/RoomCard";
import RoomPasswordModal from "../../organisms/home/RoomPasswordModal";
import GameTab from "../../molecules/home/GameTab";
import Pagination from "../../molecules/home/Pagination";
import { useState, useMemo, useEffect } from "react";
import { emitRoomJoin } from "../../../sockets/home/emit";

const RoomList = ({ roomList, keyword }) => {
  const [secureRoom, setSecureRoom] = useState(null);
  const [roomPasswordModalOpen, setRoomPasswordModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 4;

  // ✅ 필터링된 방 리스트
  const filteredRooms = useMemo(() => {
    if (!Array.isArray(roomList)) return [];
    if (keyword) {
      return roomList.filter((room) =>
        room.roomTitle.toLowerCase().includes(keyword.toLowerCase())
      );
    }
    if (activeTab === "all") return roomList;
    if (activeTab === "waiting") {
      return roomList.filter((room) => room.teamInfo?.total < 6);
    }
    return roomList.filter(
      (room) => room.gameType?.toLowerCase() === activeTab
    );
  }, [roomList, keyword, activeTab]);

  // ✅ 페이징된 방 리스트
  const paginatedRooms = useMemo(() => {
    return filteredRooms.slice(
      (currentPage - 1) * itemsPerPage,
      currentPage * itemsPerPage
    );
  }, [filteredRooms, currentPage]);

  const totalPages = Math.ceil(filteredRooms.length / itemsPerPage);

  // ✅ 탭 변경
  const handleTabChange = (tab) => {
    console.log("🔁 탭 변경:", tab);
    setActiveTab(tab);
    setCurrentPage(1);
  };

  // ✅ 비밀번호 입력 요청
  const handlePasswordRequest = (room, onConfirm) => {
    console.log("🔐 비밀번호 입력 요청 - roomId:", room.roomId);
    setSecureRoom({ ...room, onConfirm }); // 콜백 포함
    setRoomPasswordModalOpen(true);
  };

  // ✅ 비밀번호 제출 시 emit
  const handlePasswordSubmit = (roomPw) => {
    if (!secureRoom) return;
    
    // 콜백 처리
    secureRoom.onConfirm?.(roomPw);
    setRoomPasswordModalOpen(false);
    setSecureRoom(null);
  };

  // ✅ roomList undefined 방어
  if (!Array.isArray(roomList)) {
    return <p className="text-center mt-8 text-gray-500">방 정보를 불러오는 중입니다...</p>;
  }

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
                participantCount={room.teamInfo?.TOTAL}
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