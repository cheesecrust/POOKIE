// frame만 구성 api 확실해지면 기능 다시 구현 

import { useState } from "react";
import RightButton from "../../atoms/button/RightButton";
import submit_left from "../../../assets/icon/submit_left.png";
import axios from "axios";

const FriendFindModal = ({ onClose }) => {
  const [userId, setUserId] = useState("");
  const [searchResult, setSearchResult] = useState(null); // "not_found" | userData | null

//   const handleSearch = async () => {
//     if (!userId.trim()) return;
//     try {
//       const res = await axios.get(`/api/users/${userId}/`);
//       setSearchResult(res.data); // 유저 존재
//     } catch (err) {
//       setSearchResult("not_found"); // 유저 없음
//     }
//   };

//   const handleKeyDown = (e) => {
//     if (e.key === "Enter") handleSearch();
//   };

//   const handleSendRequest = async () => {
//     try {
//       await axios.post("/api/friends/request/", { target: userId });
//       alert("친구 요청 완료!");
//       onClose();
//     } catch (err) {
//       alert("친구 요청 실패...");
//     }
//   };

return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      onClick={onClose}
    >
      <div
        className="relative bg-[#fce5f0] rounded-3xl px-6 py-5 flex flex-col items-center shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-2xl font-bold mb-3">친구 찾기</h2>

        {/*  input + 버튼 */}
        <div className="relative w-[300px] mb-3">
          <input
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
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
        {searchResult === "not_found" && (
          <div className="text-sm text-gray-700">그런 유저는 존재하지 않습니다...</div>
        )}
        {searchResult && searchResult !== "not_found" && (
            <RightButton 
            // onClick={handleSendRequest}
            >친구요청</RightButton>
        )}
      </div>
    </div>
  );
};

export default FriendFindModal;