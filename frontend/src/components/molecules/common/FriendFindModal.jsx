// 친구 찾기 모달 
// api 요청 바디 확실해지면 그때 작성 틀만
// 페이지네이션도 다시 구현해야함

import { useState } from "react";
import RightButton from "../../atoms/button/RightButton";
import submit_left from "../../../assets/icon/submit_left.png";
import Pagination from "../home/Pagination";
import axios from "axios";

// 더미 데이터 
const dummyData = [
  { userId: 1, nickname: "푸키" },
  { userId: 2, nickname: "푸키푸키2" },
  { userId: 3, nickname: "푸키푸키3" },
  { userId: 4, nickname: "푸키푸키4" },
  { userId: 5, nickname: "푸키푸키5" },
  { userId: 6, nickname: "푸키푸키6" },
  { userId: 7, nickname: "푸키푸키7" },
  { userId: 8, nickname: "푸키푸키8" },
  { userId: 9, nickname: "푸키푸키9" },
  { userId: 10, nickname: "푸키푸키10" },
];

const FriendFindModal = ({ onClose }) => {
  // 친구 nickname input
  const [nickname, setNickname] = useState("");
  // 검색 결과
  const [searchResult, setSearchResult] = useState(dummyData); // userData들어가야함 
  // 전체 페이지 수 
  const [totalPages, setTotalPages] = useState(2);
  // 현재 페이지
  const [currentPage, setCurrentPage] = useState(2);
  // 검색 실패 여부 
  const [notFound, setNotFound] = useState(false);

  const handleSearch = async () => {
    if (!nickname.trim()) return;
    const filtered = dummyData.filter((u) =>
    u.nickname.includes(nickname)
    );

    setSearchResult(filtered);
    setTotalPages(2);
    setCurrentPage(2);
    setNotFound(filtered.length === 0);
    // try {
    //   const res = await axios.get(`/api/friends/candiate?search=${nickname}`);
    //   // 백엔드가 해당 nickname을 포함한 유저들의 data 리턴 
    //   setSearchResult(res.data.data); // 유저 존재
    //   setTotalPages(res.data.data.totalPages);
    //   setCurrentPage(res.data.data.currentPage);
    //   setNotFound(res.data.data.length === 0);
    // } catch (err) {
    //    console.log(err);
    //    setSearchResult([]);
    //    setNotFound(true);
    // }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") handleSearch();
  };

  const handleSendRequest = async () => {
    // try {
    //   await axios.post("/api/friends/requests", { target: userId });
    //   alert("친구 요청 완료!");
    //   onClose();
    // } catch (err) {
    //   alert("친구 요청 실패...");
    // }
  };

return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      onClick={onClose}
    >
      <div
        className="relative bg-[#fce5f0] rounded-3xl px-6 py-5 flex flex-col items-center shadow-2xl w-[450px]"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-2xl font-bold mb-3">친구 찾기</h2>

        {/*  input + 버튼 */}
        <div className="relative w-[300px] mb-3">
          <input
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            // onKeyDown={handleKeyDown}
            placeholder="유저 ID를 입력하세요"
            className="w-full h-[42px] pl-4 pr-10 rounded-full text-base outline-none bg-white shadow-md"
          />
          <button
            // onClick={handleSearch}
            className="absolute top-1/2 right-2 -translate-y-1/2 w-8 h-8"
          >
            <img
              src={submit_left}
              alt="search"
              className="w-full h-full object-contain"
            />
          </button>
        </div>

        {/* 결과 */}
        <div className="flex flex-col gap-2 w-full h-[400px] mb-3 overflow-y-auto">
          {notFound ? (
            <div className="text-sm text-gray-700">그런 유저는 존재하지 않습니다...</div>
          ) : (
            Array.from({ length: 6 }).map((_, idx) => {
              const user = searchResult[idx];
              return user ? (
                <div
                  key={user.userId}
                  className="flex justify-between items-center bg-white rounded-md px-4 py-2 shadow"
                >
                  <span className="font-bold">{user.nickname}</span>
                  <RightButton
                    size="xs"
                    onClick={() => handleSendRequest(user.userId, user.nickname)}
                  >
                    친구요청
                  </RightButton>
                </div>
              ) : (
                <div
                  key={`empty-${idx}`}
                  className="bg-[#F9E5F0] h-[38px] rounded-md px-4 py-2"
                ></div>
              );
            })
          )}
        </div>
        
        {/* 친구 결과 있을때만 pagination */}
        {!notFound && totalPages >1 && (
          <div className="w-full flex justify-center mb-3">
            <Pagination
              totalPages={totalPages}
              currentPage={currentPage}
              onPageChange={(page) => setCurrentPage(page)}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default FriendFindModal;