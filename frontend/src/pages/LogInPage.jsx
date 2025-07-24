import FriendList from "../components/molecules/common/FriendList";
import ChatBox from "../components/molecules/common/ChatBox";
import MessageList from "../components/molecules/common/MessageList";
import FriendMessageTab from "../components/molecules/common/FriendMessageTab";

const LogInPage = () => {
  return (
    <>
    <ChatBox width="300px" height="300px" /> 
    <FriendList
      friends={[
        {
          nickname: '다예',
          characterName: 'pooding_strawberry',
          isOnline: true,
        },
        {
          nickname: '유진',
          characterName: 'pooding_milk',
          isOnline: false,
        },
      ]}
    />
    <MessageList
      messageType="received"
      messages={[
        {
          nickname: '다예',
          date: '2025-07-21 19:00:00',
          messageContent: 'ㅎㅇ',
          isRead: false,
        },
        {
          nickname: '유진',
          date: '2025-07-21 19:02:00',
          messageContent: '6시에 게임 ㄱㄱ',
          isRead: false,
        },
      ]}
    />

<MessageList
      messageType="sent"
      messages={[
        {
          nickname: '다예',
          date: '2025-07-21 19:00:00',
          messageContent: 'ㅎㅇ',
          isRead: true,
        },
        {
          nickname: '유진',
          date: '2025-07-21 19:02:00',
          messageContent: '6시에 게임 ㄱㄱ',
          isRead: false,
        },
      ]}
    />
    <FriendMessageTab activeTab="received" />
      <div>LogInPage</div>
    </>
    
  );
};

export default LogInPage;
