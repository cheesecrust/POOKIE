// 친구 찾기 모달 
// api 요청 바디 확실해지면 그때 작성 틀만
// 페이지네이션도 다시 구현해야함

import { useState,useEffect } from "react";
import axiosInstance from "../../../lib/axiosInstance";
import RightButton from "../../atoms/button/RightButton";
import submit_left from "../../../assets/icon/submit_left.png";
import Pagination from "../home/Pagination";
import BasicModal from "../../atoms/modal/BasicModal";
import useAuthStore from "../../../store/useAuthStore";

const FriendFindModal = ({ onClose }) => {
  const { user } = useAuthStore();
  // 내 id 
  const myAccountId = user.userAccountId;
  // 친구 nickname input
  const [nickname, setNickname] = useState("");
  // 검색 결과
  const [searchResult, setSearchResult] = useState([]); // userData들어가야함 
  // 전체 페이지 수 
  const [totalPages, setTotalPages] = useState(1);
  // 현재 페이지
  const [currentPage, setCurrentPage] = useState(1);
  // 검색 실패 여부 
  const [notFound, setNotFound] = useState(false);

  const [confirmOpen, setConfirmOpen] = useState(false); //  확인 모달
  const [confirmMsg, setConfirmMsg] = useState("");      //  메시지
  const openConfirm = (msg) => { setConfirmMsg(msg); setConfirmOpen(true); };
  const closeConfirm = () => setConfirmOpen(false);

  useEffect(() => {
    if (!nickname.trim()) return;
    // console.log("user",user);
    // console.log("myAccountId",myAccountId);

    handleSearch()
  }, [currentPage,nickname]);


  // 입력 바뀌면 1페이지부터 다시
  const onChangeNickname = (e) => {
    const v = e.target.value;
    setNickname(v);
    if (currentPage !== 1) setCurrentPage(1);
  };

  // 검색 함수
  const handleSearch = async () => {
    if (!nickname.trim()) return;

    try {
      const res = await axiosInstance.get(`/friends/candidate?search=${nickname}&size=6&page=${currentPage - 1}`);
      // 백엔드가 해당 nickname을 포함한 유저들의 data 리턴 
      console.log("응답:", res.data.data);
      setSearchResult(res.data.data.content); // 유저 존재
      setTotalPages(res.data.data.totalPages);
      setNotFound(res.data.data.content.length === 0);
      console.log("검색 성공");
    } catch (err) {
       console.log(err);
       setSearchResult([]);
       setNotFound(true);
       console.log("검색 실패",err);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") handleSearch();
  };

  // 친구 요청 함수
  const handleSendRequest = async (userId,nickname) => {
    try {
      if(myAccountId === userId) return;
      await axiosInstance.post("/friends/requests", { 
        addresseeId: userId, 
        addresseeNickname: nickname, 
      });
      console.log(userId)
      console.log(nickname)
      console.log("친구 요청 완료!");
      openConfirm(`${nickname}님에게 친구 요청을 보냈습니다!`);
    } catch (err) {
      console.log("친구 요청 실패...");
    }
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
            onChange={onChangeNickname}
            onKeyDown={handleKeyDown}
            placeholder="유저 닉네임을을 입력하세요"
            className="w-full h-[42px] pl-4 pr-10 rounded-full text-base outline-none bg-white shadow-md"
          />
          <button
            onClick={handleSearch}
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
              setCurrentPage={setCurrentPage}
            />
          </div>
        )}

        {/* 친구 요청 확인  */}
        <BasicModal backgroundPoacity="opacity-100" isOpen={confirmOpen} onClose={closeConfirm}>
          <div className="p-4 text-center">
            <p className="mb-3 whitespace-pre-line">{confirmMsg}</p>
            <RightButton size="sm" onClick={closeConfirm}>확인</RightButton>
          </div>
        </BasicModal>
      </div>
    </div>
  );
};

export default FriendFindModal;