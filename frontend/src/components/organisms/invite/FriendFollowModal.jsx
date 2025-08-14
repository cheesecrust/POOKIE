//

// src/components/organisms/waiting/FriendInviteModal.jsx
import { useEffect, useState } from "react";
import axiosInstance from "../../../lib/axiosInstance";
import RightButton from "../../atoms/button/RightButton";
import Pagination from "../../molecules/home/Pagination";
import { emitFollow } from "../../../sockets/waiting/emit";
import BasicModal from "../../atoms/modal/BasicModal";

const FriendFollowModal = ({ onClose }) => {
  const [friends, setFriends] = useState([]);
  const [totalPages, setTotalPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);

  // 알림 모달
  const [noticeOpen, setNoticeOpen] = useState(false);
  const [noticeMsg, setNoticeMsg] = useState("");

  const openNotice = (msg) => {
    setNoticeMsg(msg);
    setNoticeOpen(true);
  };
  const closeNotice = () => setNoticeOpen(false);

  // 친구 목록 api
  const fetchFriends = async (page0 = 0) => {
    try {
      setLoading(true);
      const res = await axiosInstance.get("/friends", {
        params: { search: "", size: 5, page: page0 },
      });
      const { content = [], totalPages = 1 } = res?.data?.data ?? {};
      setFriends(content);
      setTotalPages(totalPages);
      if (currentPage > totalPages) setCurrentPage(totalPages || 1);
    } catch (err) {
      console.log("친구 목록 불러오기 실패:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchFriends(currentPage - 1); }, [currentPage]);

  // id 추출
  const getId = (f) => f?.userId;

  // 따라가기 동작
  const handleFollow = async (friend) => {
    const id = getId(friend);
    if (!id) {
      openNotice("유효하지 않은 유저입니다.");
      return;
    }
    const online = !!friend?.online;
    if (!online) {
      openNotice(`${friend?.nickname ?? "해당 유저"}님은 오프라인입니다.`);
      return;
    }
    try {
      emitFollow({ userId:id });
    } catch (e) {
      console.log("따라가기 실패", e);
    }
  };

  return (
    <div className="w-[420px] max-w-[92vw]">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-xl font-bold">친구 따라가기</h2>
        {onClose && (
          <button onClick={onClose} className="text-black hover:opacity-70 text-xl leading-none" aria-label="닫기">
            ×
          </button>
        )}
      </div>

      <div className="bg-[#FDE1F0] border border-pink-300 rounded-md shadow-sm">
        <div className="max-h-[360px] overflow-y-auto divide-y divide-pink-200 bg-white/80 rounded-t-md">
          {loading ? (
            <div className="p-6 space-y-3">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-2.5 h-2.5 rounded-full bg-gray-300 animate-pulse" />
                    <div className="w-28 h-4 bg-gray-200 rounded animate-pulse" />
                  </div>
                  <div className="w-16 h-7 bg-gray-200 rounded border animate-pulse" />
                </div>
              ))}
            </div>
          ) : friends.length === 0 ? (
            <div className="p-6 text-center text-sm text-gray-600">
              친구가 없어요...
            </div>
          ) : (
            friends.map((f) => {
              const id = getId(f);
              const online = f?.online;

              return (
                <div key={id} className="flex items-center justify-between px-4 py-3">
                  <div className="min-w-0 flex items-center gap-2">
                    <span
                      className={`inline-block w-2.5 h-2.5 rounded-full ${
                        online ? "bg-green-500" : "bg-gray-400"
                      }`}
                      title={online ? "Online" : "Offline"}
                    />
                    <span className="font-semibold truncate">{f?.nickname}</span>
                    <span className="ml-2 text-xs text-gray-500">
                      {online ? "Online" : "Offline"}
                    </span>
                  </div>

                  <RightButton
                    onClick={() => handleFollow(f)}
                    className="ml-3 shrink-0 px-3 h-8 rounded text-xs border-2 bg-white border-black hover:bg-gray-100"
                  >
                    따라가기
                  </RightButton>
                </div>
              );
            })
          )}
        </div>

        {/* 페이지네이션 */}
        <div className="flex items-center justify-center p-3 rounded-b-md">
          <Pagination
            currentPage={currentPage}
            setCurrentPage={setCurrentPage}
            totalPages={totalPages}
          />
        </div>

        {/* 알림 모달 */}
      <BasicModal isOpen={noticeOpen} onClose={closeNotice}>
        <div className="w-[280px] max-w-[82vw] text-center">
          <p className="whitespace-pre-line">{noticeMsg}</p>
          <div className="mt-4">
            <RightButton onClick={closeNotice} size="sm">
              확인
            </RightButton>
          </div>
        </div>
      </BasicModal>

      </div>
    </div>
  );
};

export default FriendFollowModal;
