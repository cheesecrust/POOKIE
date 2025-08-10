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


const FriendMessageModal = ({onClose}) => {
  // 탭 상태 관리
  const [activeTab, setActiveTab] = useState('friend')
  // 전체 페이지 상태 관리
  const [totalPages, setTotalPages] = useState(1)
  // 현재 페이지 상태 관리
  const [currentPage, setCurrentPage] = useState(1)
  // 친구 찾기 모달 상태 관리
  const [isFindModalOpen, setIsFindModalOpen] = useState(false)

  // 유저 친구 상태 관리
  const [friends, setFriends] = useState([]) // [...{userid,nickname,status}]
  // 유저 받은 쪽지함 상태 관리 
  const [receivedMessages, setReceivedMessages] = useState([]) // nickname, date, messageContent, isRead
  // 유저 보낸 쪽지함 상태 관리 
  const [sentMessages, setSentMessages] = useState([]) // nickname, date, messageContent, isRead

  // 모달 첫 로딩 데이터 요청
  useEffect(() => {
    fetchFriends();
    fetchReceivedMessages();
    fetchSentMessages();
  }, []);

  // 탭 변경 시 데이터 갱신
  useEffect(() => {
    if(activeTab === 'received'){
      fetchReceivedMessages();
    }else if(activeTab === 'sent'){
      fetchSentMessages()
    }else{
      fetchFriends()
    }
  }, [activeTab]);

  // currentPage 바뀔 때마다 다시 FriendList 요청
  useEffect(() => {
    fetchFriends(currentPage-1);
  }, [currentPage]);
  useEffect(() => {
    fetchReceivedMessages(currentPage-1);
  }, [currentPage]);
  useEffect(() => {
    fetchSentMessages(currentPage-1);
  }, [currentPage]);

  // 친구 목록 api 요청    
  const fetchFriends = async (page = 0) => {
    try {
      const res = await axiosInstance.get('/friends',{
        params: {
          search : '',
          size: 4,
          page: page
        }
      });

      const { content, totalPages } = res.data.data;
      setFriends(content);
      setTotalPages(totalPages);
      console.log("친구 목록:",content);
      console.log("친구api",res.data.data);
    } catch (err) {
      console.log("친구 목록 불러오기 실패:",err);
    }
  }

  // 받은 쪽지 api 요청
  const fetchReceivedMessages = async () => {
    try {
      const res = await axiosInstance.get('/letter/received', {
        params: {
          size: 4,
          page: currentPage-1
        }
      });
      console.log("받은 쪽지 api",res.data);
      const receivedMessage = res.data.data.content;
      const totalPage = res.data.data.totalPages;
      setReceivedMessages(receivedMessage);
      setTotalPages(totalPage);
      console.log("받은 쪽지:",receivedMessage);
    } catch (err) {
      console.log("받은 쪽지 불러오기 실패:",err);
    }
  };

  // 보낸 쪽지 api 요청
  const fetchSentMessages = async () => {
    try {
      const res = await axiosInstance.get('/letter/sent', {
        params: {
          size: 4,
          page: currentPage-1,
        }
      });
      const sentMessage = res.data.data.content;
      const totalPage = res.data.data.totalPages;
      setSentMessages(sentMessage);
      setTotalPages(totalPage);
      console.log("보낸 쪽지:",sentMessage);
    } catch (err) {
      console.log("보낸 쪽지 불러오기 실패:",err);
    }
  };

  // 쪽지 삭제 api 요청
  const handleDeleteMessage = async (requestId, type='received') => {
    try {
      const res = await axiosInstance.delete(`/letter/${requestId}`);
      if(type==='received'){
        setReceivedMessages(prev => prev.filter(m=>m.requestId!==requestId))
      }else{
        setSentMessages(prev => prev.filter(m=>m.requestId!==requestId))
      }
      console.log(requestId)
      console.log("쪽지 삭제:",res.data);
    } catch (err) {
      console.log("쪽지 삭제 실패:",err);
    }
  }

  // 받은 쪽지 신고 api 요청
  const handleReportMessage = (messageId) => {
  }

  // 친구 삭제 버튼 클릭 시 api 요청
  const handleRemoveFriend = async(friendId) => {
    try {
      const res = await axiosInstance.delete(`/friends/${friendId}`);
      console.log("친구 삭제:",res.data);
      setFriends((prev) => prev.filter(friend => friend.userId !== friendId))
    } catch (err) {
      console.log("친구 삭제 실패:",err);
    }
  }

  // 친구 수락 api 요청 ( 수락 + 쪽지 삭제)
  const handleAcceptFriend = async (requestId) => {
    try {
      const res = await axiosInstance.post(`/friends/requests/${requestId}/accept`);
      const res1 = await axiosInstance.delete(`/letter/${requestId}`);
      console.log("친구 수락:",res.data.data);
      console.log("쪽지 삭제:",res1.data.data);
      setReceivedMessages((prev) => prev.filter(message => message.requestId !== requestId))
    } catch (err) {
      console.log("친구 수락 실패:",err);
    }
  }

  // 친구 거절 api 요청 ( 거절 + 쪽지 삭제)
  const handleRejectFriend = async (requestId) => {
    try {
      const res = await axiosInstance.post(`/friends/requests/${requestId}/reject`);
      const res1 = await axiosInstance.delete(`/letter/${requestId}`);
      console.log("친구 거절:",res.data.data);
      console.log("쪽지 삭제:",res1.data.data);
      setReceivedMessages((prev) => prev.filter(message => message.requestId !== requestId))
    } catch (err) {
      console.log("친구 거절 실패:",err);
    }
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
    <div className="relative w-[650px] h-[620px] bg-[#EBABAB] z-10 rounded-2xl shadow-xl pt-[60px] overflow-visible">
      {/* 상단 탭 */}
      <div className="absolute top-[-30px] left-0 w-full flex justify-center z-[1]">
        <FriendMessageTab activeTab={activeTab} onTabChange={setActiveTab} />
      </div>
 

      {/* 본문 */}
      <div className="flex flex-col justify-start h-full px-6 pt-2 pb-6">
        {/* 콘텐츠 (높이 고정, 스크롤 제거) */}
        <div className="h-[420px] flex flex-col gap-3">
          {activeTab === 'friend' && 
          <FriendList 
            friends={friends} 
            onRemoveFriend={handleRemoveFriend} 
            />}
          {activeTab === 'received' && (
            <MessageList messageType="received" 
            messages={receivedMessages} 
            onDelete={handleDeleteMessage}
            onReport={handleReportMessage}
            onAccept={handleAcceptFriend}
            onReject={handleRejectFriend}
            />
          )}
          {activeTab === 'sent' && (
            <MessageList messageType="sent"
             messages={sentMessages} 
             onDelete={handleDeleteMessage}
             />
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
