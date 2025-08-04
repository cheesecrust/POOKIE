// src/pages/HomePage.jsx
import RoomCreateModal from "../components/organisms/home/RoomCreateModal";
import ModalButton from "../components/atoms/button/ModalButton";
import RoomList from "../components/organisms/home/RoomList";
import Header from "../components/molecules/home/Header";
import Footer from "../components/molecules/home/Footer";
import SearchBar from "../components/molecules/home/SearchBar";
import toggleLeft from "../assets/icon/toggle_left.png";
import defaultCharacter from "../assets/character/pooding_milk.png";
import useAuthStore from "../store/useAuthStore";
import useRoomStore from "../store/useRoomStore";
import KickNoticeModal from "../components/molecules/home/KickNoticeModal";
import characterImageMap from "../utils/characterImageMap";
import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { getSocket } from "../sockets/websocket";
import handleHomeMessage from "../sockets/home/handleHomeMessage";

const HomePage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuthStore();
  const { logout } = useAuthStore();
  const { isLoggedIn } = useAuthStore((state) => state);
  const roomList = useRoomStore((state) => state.roomList);
  const [keyword, setKeyword] = useState("");
  const [roomCreateModalOpen, setRoomCreateModalOpen] = useState(false);
  const [isKicked, setIsKicked] = useState(false);

  // 로그아웃시 '/' 로 리다이렉트
  useEffect(() => {
    if (!isLoggedIn) {
      navigate("/", { replace: true });
    }
  }, [isLoggedIn, navigate]);

  // 강퇴 모달
  useEffect(() => {
    if (location.state?.kicked) {
      setIsKicked(true);
      
      // 1초 후 자동 닫기
      const timer = setTimeout(() => {
        setIsKicked(false);
      }, 1000);
      
      return () => clearTimeout(timer); // 클린업
    }
  }, [location.state]);
  
  // 🔍 검색 함수 (백엔드 연동 시 수정 예정)
  const handleSearch = (keyword) => {
    setKeyword(keyword);
    console.log("검색어:", keyword);
    // 예: 검색 API 요청 or 상태 전달
  };

  // ✅ user 정보 전체 방어 처리
  if (!user || !user.repCharacter) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-lg font-semibold text-gray-600">로딩 중...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-[#FCDDDD] text-black">
      {/* 상단 고정 헤더 */}
      <Header />

      {/* 본문 콘텐츠 */}
      <main className="flex-grow flex flex-col items-center mt-10">
        {/* 좌우 배치: 텍스트+버튼(왼쪽) + 유저 프로필(오른쪽) */}
        <div className="w-full max-w-[1000px] mt-8 px-4 flex gap-2 items-start">
          {/* 왼쪽: 텍스트 + 버튼 */}
          <div className="w-[55%]">
            <h1 className="text-2xl font-bold text-left leading-relaxed mt-4">
              오늘도 좋은 하루!
              <br />
              {user?.nickname}님, 어서오세요~!
            </h1>

            <div className="flex gap-4 mt-8">
              <ModalButton
                onClick={() => setRoomCreateModalOpen(true)}
                className="px-6 py-2 rounded-full shadow-md hover:brightness-95"
              >
                방 생성하기
              </ModalButton>
              <ModalButton
                onClick={() => setRoomCreateModalOpen(true)}
                className="px-6 py-2 rounded-full shadow-md hover:brightness-95"
              >
                혼자 하기
              </ModalButton>
            </div>
          </div>

          {/* 오른쪽: 유저 프로필 */}
          <div className="bg-white p-4 rounded-xl border shadow-sm w-[40%] text-sm text-left flex flex-row gap-4 items-center">
            {/* 왼쪽: 대표 캐릭터 이미지 */}
            <div className="flex-shrink-0">
              <img
                src={characterImageMap[user?.repCharacter?.name] || defaultCharacter}
                alt="대표캐릭터"
                className="w-32 h-32 object-contain"
              />
            </div>

            {/* 오른쪽: 유저 정보 + 마이페이지지 버튼 묶음 */}
            <div className="flex flex-col justify-between flex-grow h-full">
              {/* 유저 정보 */}
              <div className="flex flex-col gap-1">
                <p className="font-semibold">
                  닉네임 : {user?.nickname}
                </p>
                <p>EXP : {user?.repCharacter.step}</p>
                <div className="bg-black h-2 rounded mt-1 mb-2 w-full">
                  <div className="bg-[#F4C0C0] h-full w-[100%] rounded"></div>
                </div>
              </div>

              {/* 마이페이지 버튼 (하단 고정) */}
              <div className="flex justify-end mt-4">
                <ModalButton
                  onClick={async () => {
                    navigate("/myroom");
                  }}
                  className="w-fit"
                >
                  마이페이지
                </ModalButton>
              </div>
            </div>
          </div>
        </div>

        {/* 오른쪽 하단 로그아웃 */}
        <div className="w-full max-w-[1000px] px-4 flex justify-end mt-2 mr-24">
          <div
            className="flex items-center gap-1 hover:underline cursor-pointer"
            onClick={async () => {
              await logout();
              navigate("/");
            }}
          >
            <img src={toggleLeft} alt="화살표" className="w-3 h-3 mr-1" />
            <span>로그아웃</span>
          </div>
        </div>

        {/* 검색창 */}
        <div className="w-full max-w-[1000px] mt-10 mb-6">
          <SearchBar onSearch={handleSearch} placeholder="방 이름으로 검색" />
        </div>

        {/* 방 리스트 */}
        <RoomList keyword={keyword} roomList={roomList} />

        {/* 강퇴 모달 */}
        {isKicked && <KickNoticeModal />}

        {/* 모달 */}
        <RoomCreateModal
          isOpen={roomCreateModalOpen}
          onClose={() => setRoomCreateModalOpen(false)}
        />
      </main>
      {/* 하단 고정 푸터 */}
      <Footer />
    </div>
  );
};

export default HomePage;
