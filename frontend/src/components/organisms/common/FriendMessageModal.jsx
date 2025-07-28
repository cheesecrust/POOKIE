// atom-푸키푸키버튼이랑 연동헀음 organism/common/FriendMessageWrapper
// 기능 구현
// 1. 친구리스트
// 2. 메시지리스트
// 3. 페이지네이션
// 4. 친구찾기
// 5. 모달닫기 아직 구현 못함
// 미완성

import { useState } from 'react'
import { Axios } from 'axios'
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
  // 현재 페이지 상태 관리
  const [currentPage, setCurrentPage] = useState(1)
  // 친구 찾기 모달 상태 관리
  const [isFindModalOpen, setIsFindModalOpen] = useState(false)

  //  이 컴포넌트에서 직접 불러와야 할 데이터들 (API 호출 등)
  // 1. 로그인한 유저의 친구 리스트
  //   const [friends, setFriends] = useState([]) // characterName, nickname, isOnline
  // 2. 받은 쪽지 리스트
  //   const [receivedMessages, setReceivedMessages] = useState([]) // nickname, date, messageContent, isRead
  // 3. 보낸 쪽지 리스트
  //   const [sentMessages, setSentMessages] = useState([]) // nickname, date, messageContent, isRead

    // 이 컴포넌트 또는 부모에서 정의해서 내려줘야 할 함수들

    // useEffect(() => {
    //   // 모달 열릴 때 데이터 요청
    //   fetchFriends();
    //   fetchReceivedMessages();
    //   fetchSentMessages();
    // }, []);
    
    // 친구 목록 api 요청    
    // const fetchFriends = async () => {
    //   const res = await axios.get("/api/friends/");
    //   setFriends(res.data);
    // };

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

    const handleSendMessage = () => {
    // 쪽지 보내기 로직 (ex. 모달 열기 or API 요청)
    }

    const handleDeleteMessage = () => {
    // 쪽지 삭제 API 요청
    }

    const handleReportMessage = (messageId) => {
    // 쪽지 신고 API 요청
    }

    const handleRemoveFriend = (nickname) => {
    // 친구 삭제 API 요청
    }

    const handleOpenFindFriend = () => {
    // 친구 찾기 버튼 클릭 시 모달 OPEN
      setIsFindModalOpen(true)
    }

    const handleCloseFindFriend = () => {
    // 친구 찾기 버튼 클릭 시 모달 CLOSE
      setIsFindModalOpen(false)
    }

// 페이지네이션 관련해서도 다시 생각
  const itemsPerPage = 5
  const totalPages = Math.ceil(dummyFriends.length / itemsPerPage)

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
          {activeTab === 'friend' && <FriendList friends={dummyFriends} />}
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

export default FriendMessageModal
