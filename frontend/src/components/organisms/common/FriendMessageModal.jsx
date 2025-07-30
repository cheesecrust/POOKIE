// 경로: src/components/organisms/common/FriendMessageModal.jsx
// atom-푸키푸키버튼이랑 연동헀음 organism/common/FriendMessageWrapper
// 기능 구현
// 1. 친구리스트
// 2. 메시지리스트
// 3. 페이지네이션
// 4. 친구찾기
// 5. 모달닫기 아직 구현 못함
// 미완성

// 친구 리스트 / 쪽지 리스트 API 호출 , 상태저장
// 해당 organism에서 필요한 함수 : 쪽지, 친구 삭제 / 신고 처리 (상태 변화)
// 페이지네이션 상태 관리 
// 친구 찾기 모달 

import { useState, useEffect } from 'react'
import axiosInstance from '../../../lib/axiosInstance'
import FriendMessageTab from '../../molecules/common/FriendMessageTab'
import FriendList from '../../molecules/common/FriendList'
import MessageList from '../../molecules/common/MessageList'
import Pagination from '../../molecules/home/Pagination'
import RightButton from '../../atoms/button/RightButton'
import FriendFindModal from '../../molecules/common/FriendFindModal'
import BasicModal from '../../atoms/modal/BasicModal'

const dummyFriends = [
  { nickname: '다예', characterName: 'pooding_strawberry', isOnline: true, onMessage: () => {} },
  { nickname: '유진', characterName: 'pooding_milk', isOnline: false, onMessage: () => {} },
  { nickname: '채연', characterName: 'pooding_matcha', isOnline: false, onMessage: () => {} },
  { nickname: '한슬', characterName: 'pooding_melon', isOnline: true, onMessage: () => {} },
  { nickname: '연수', characterName: 'pooding_strawberry', isOnline: true, onMessage: () => {} },
  { nickname: '재환환', characterName: 'pooding_strawberry', isOnline: true, onMessage: () => {} },

]

const dummyReceivedMessages = [
  { nickname: '유진', date: '2025-07-27 10:00:00', messageContent: 'ㅎㅇ', isRead: false, onDelete: () => {}, onReport: () => {} },
]

const dummySentMessages = [
  { nickname: '채연', date: '2025-07-26 18:20:00', messageContent: 'ㅂㅇ', isRead: true, onDelete: () => {} },
]

const FriendMessageModal = ({onClose}) => {
  // 탭 상태 관리
  const [activeTab, setActiveTab] = useState('friend')
  // 전체 페이지 상태 관리
  const [totalPages, setTotalPages] = useState(1)
  // 현재 페이지 상태 관리
  const [currentPage, setCurrentPage] = useState(1)
  // 친구 찾기 모달 상태 관리
  const [isFindModalOpen, setIsFindModalOpen] = useState(false)

  const [friends, setFriends] = useState([]) // [...{userid,nickname,status}]
  const [receivedMessages, setReceivedMessages] = useState([]) // nickname, date, messageContent, isRead
  const [sentMessages, setSentMessages] = useState([]) // nickname, date, messageContent, isRead

  // 모달 첫 로딩 데이터 요청
  useEffect(() => {
    fetchFriends();
    // fetchReceivedMessages();
    // fetchSentMessages();
  }, []);

  // currentPage 바뀔 때마다 다시 FriendList 요청
  useEffect(() => {
    fetchFriends(currentPage);
  }, [currentPage]);

  // 친구 목록 api 요청    
  const fetchFriends = async (page = 0) => {
    try {
      const res = await axiosInstance.get('/friends',{
        params: {
          search : '',
          size: 4,
          page
        }
      });

      const { content, totalPages } = res.data.data;
      setFriends(content);
      setTotalPages(totalPages);
    } catch (err) {
      console.log("친구 목록 불러오기 실패:",err);
    }
  }

  // 받은 메시지 api 요청
  // const fetchReceivedMessages = async () => {
  //   const res = await axios.get("/api/messages/");
  //   setReceivedMessages(res.data);
  // };

  // 보낸 메시지 api 요청
  // const fetchSentMessages = async () => {
  //   const res = await axios.get("/api/messages/");
  //   setSentMessages(res.data);
  // };

  const handleDeleteMessage = () => {
  // 쪽지 삭제 API 요청
  }

  const handleReportMessage = (messageId) => {
  // 쪽지 신고 API 요청
  }

  const handleRemoveFriend = (nickname) => {
  // 친구 삭제 API 요청
  }

  // 친구 찾기 버튼 클릭 시 모달 OPEN
  const handleOpenFindFriend = () => {
    setIsFindModalOpen(true)
  }

  // 친구 찾기 버튼 클릭 시 모달 CLOSE
  const handleCloseFindFriend = () => {
    setIsFindModalOpen(false)
  }

  return (
    <div className="relative w-[520px] h-[620px] bg-[#EBABAB] z-10 rounded-2xl shadow-xl pt-[60px] overflow-visible">
      {/* 상단 탭 */}
      <div className="absolute top-[-30px] left-0 w-full flex justify-center z-[1]">
        <FriendMessageTab activeTab={activeTab} onTabChange={setActiveTab} />
      </div>
 

      {/* 본문 */}
      <div className="flex flex-col justify-start h-full px-6 pt-2 pb-6">
        {/* 콘텐츠 (높이 고정, 스크롤 제거) */}
        <div className="h-[420px] flex flex-col gap-3">
          {activeTab === 'friend' && <FriendList friends={friends} />}
          {activeTab === 'received' && (
            <MessageList messageType="received" messages={dummyReceivedMessages} />
          )}
          {activeTab === 'sent' && (
            <MessageList messageType="sent" messages={dummySentMessages} />
          )}
        </div>

        {/* 하단 영역: 페이지네이션과 친구 찾기 버튼 */}
        <div className="flex-1 flex flex-col justify-end">
          {/* 페이지네이션 */}
          <div className="flex justify-center mb-3">
            <Pagination
              currentPage={currentPage}
              setCurrentPage={setCurrentPage}
              totalPages={totalPages}
            />
          </div>

          {/* 친구찾기 버튼: 우측 하단 absolute */}
          <div className="absolute bottom-2 right-4">
            <RightButton onClick={handleOpenFindFriend} size="sm" className="text-xs px-3 py-1 h-8">
              친구 찾기
            </RightButton>
          </div>

        {/* 친구 찾기 모달 */}
        <BasicModal isOpen={isFindModalOpen} onClose={handleCloseFindFriend}>
          <FriendFindModal onClose={handleCloseFindFriend} />
        </BasicModal>
        
        </div>
      </div>
    </div>
  )
}
export default FriendMessageModal;
