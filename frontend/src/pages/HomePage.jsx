// src/pages/HomePage.jsx
import RoomPasswordModal from "../components/organisms/home/RoomPasswordModal";
import RoomCreateModal from "../components/organisms/home/RoomCreateModal";
import ModalButton from "../components/atoms/button/ModalButton";
import RoomList from "../components/organisms/home/RoomList";
import Header from "../components/molecules/home/Header";
import Footer from "../components/molecules/home/Footer";
import SearchBar from "../components/molecules/home/SearchBar";
import useAuthStore from "../store/store";
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { connectSocket } from "../sockets/common/websocket";
import { handleHomeSocketMessage } from "../sockets/home/onmessage";

const HomePage = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [keyword, setKeyword] = useState("");
  const [roomList, setRoomList] = useState([]);
  const [roomCreateModalOpen, setRoomCreateModalOpen] = useState(false);
  const [roomPasswordModalOpen, setRoomPasswordModalOpen] = useState(false);

  useEffect(() => {
    const token = useAuthStore.getState().accessToken;

    connectSocket({
      url: import.meta.env.VITE_SOCKET_URL,
      token,
      onMessage: (e) => {
        const msg = JSON.parse(e.data);
        handleHomeSocketMessage(msg, {
          setRooms: setRoomList,
          setUser: setUser,
          navigateToWaiting: (room) => navigate("/waiting", { state: { room } }),
          showErrorModal: (msg) => alert(msg),
          closeRoomModal: () => setRoomCreateModalOpen(false),
        });
      },
      onOpen: () => console.log("소켓 연결됨"),
      onClose: () => console.log("소켓 종료"),
      onError: () => console.log("소켓 에러"),
    });
  }, []);

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
      <main className="flex-grow flex flex-col items-center mt-10">
        {/* 좌우 배치: 텍스트+버튼(왼쪽) + 유저 프로필(오른쪽) */}
        <div className="w-full max-w-[900px] mt-8 px-4 flex gap-2 items-start">
          {/* 왼쪽: 텍스트 + 버튼 */}
          <div className="w-[55%]">
            <h1 className="text-2xl font-bold text-left leading-relaxed mt-4">
              오늘도 좋은 하루!<br />다예님, 어서오세요~!
            </h1>

            <div className="flex gap-4 mt-8">
              <ModalButton
                onClick={() => setRoomCreateModalOpen(true)}
                className="px-6 py-2 rounded-full shadow-md hover:brightness-95"
              >
                방 생성하기
              </ModalButton>
              <ModalButton
                onClick={() => setRoomPasswordModalOpen(true)}
                className="px-6 py-2 rounded-full shadow-md hover:brightness-95"
              >
                혼자 하기
              </ModalButton>
            </div>
          </div>

          {/* 오른쪽: 유저 프로필 */}
          <div className="bg-white p-4 rounded-xl border shadow-sm w-[45%] text-sm text-left flex flex-col gap-2">
            <div className="flex justify-center">
              <img src="/your-character.png" alt="캐릭터" className="w-full mb-2" /> {/* 캐릭터 이미지 */}
            </div>
            <p className="font-semibold">닉네임 : {user?.userNickname}</p>
            <p>LV. {user?.level}</p>
            <p>EXP : {user?.exp}</p>
            <div className="bg-black h-2 rounded mt-1 mb-2">
              <div className="bg-[#F4C0C0] h-full w-[100%] rounded"></div> {/* exp bar */}
            </div>
            <ModalButton
              onClick={async () => {
                await useAuthStore.getState().logout();
                navigate('/');
              }}
              className="w-fit self-end"
            >
              로그아웃
            </ModalButton>
          </div>
        </div>

        {/* 검색창 */}
        <div className="w-full max-w-[900px] mt-10 mb-6">
          <SearchBar
            onSearch={handleSearch}
            placeholder="방 이름으로 검색"
          />
        </div>

        {/* 방 리스트 */}
        <RoomList keyword={keyword} roomList={roomList} />

        {/* 모달 */}
        <RoomCreateModal isOpen={roomCreateModalOpen} onClose={() => setRoomCreateModalOpen(false)} />
        <RoomPasswordModal isOpen={roomPasswordModalOpen} onClose={() => setRoomPasswordModalOpen(false)} />
      </main>
      {/* 하단 고정 푸터 */}
      <Footer />
    </div>
  );
};

export default HomePage;
