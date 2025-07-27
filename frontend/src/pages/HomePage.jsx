// src/pages/HomePage.jsx
import RoomPasswordModal from "../components/organisms/home/RoomPasswordModal";
import RoomCreateModal from  "../components/organisms/home/RoomCreateModal";
import RoomList from "../components/organisms/home/RoomList";
import Header from "../components/molecules/home/Header";
import Footer from "../components/molecules/home/Footer";
import SearchBar from "../components/molecules/home/SearchBar";
import { useState } from 'react'

const HomePage = () => {
  const [keyword, setKeyword] = useState("");

  // 🔍 검색 함수 (백엔드 연동 시 수정 예정)
  const handleSearch = (keyword) => {
    setKeyword(keyword);
    console.log("검색어:", keyword);
    // 예: 검색 API 요청 or 상태 전달
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#FCDDDD] text-black">
      {/* 상단 고정 헤더 */}
      <Header />

      {/* 본문 콘텐츠 */}
      <main className="flex-grow flex flex-col items-center">
        {/* 상단 텍스트 + 버튼 + 유저 정보 → 추후 컴포넌트로 분리 가능 */}
        <div className="w-full max-w-[900px] mt-8 px-4 text-center space-y-4">
          <h1 className="text-2xl font-bold">오늘도 좋은 하루!<br/>다예님, 어서오세요~</h1>

          {/* 버튼 영역 */}
          <div className="flex justify-center gap-4">
            <button className="bg-[#F4C0C0] px-6 py-2 rounded-full shadow-md hover:brightness-95">
              ▶ 방 생성하기
            </button>
            <button className="bg-white px-6 py-2 rounded-full shadow-md hover:brightness-95">
              ▶ 혼자 하기
            </button>
          </div>

          {/* (예시) 유저 프로필 */}
          <div className="flex justify-center mt-2">
            <div className="bg-white p-4 rounded-xl border shadow-sm">
              <p className="font-semibold">닉네임: 다예</p>
              <p>LV. 3</p>
              <p>EXP: 100</p>
              <button className="text-sm underline mt-1">로그아웃</button>
            </div>
          </div>
        </div>

        {/* 검색창 */}
        <SearchBar onSearch={handleSearch} />

        {/* 방 리스트 */}
        <RoomList keyword={keyword} />
      </main>

      {/* 하단 고정 푸터 */}
      <Footer />
    </div>
  );
};

export default HomePage;
