import FriendCard from "../components/atoms/message/FriendCard";

const LogInPage = () => {
  return (
    <>
      <FriendCard nickname="다예" characterName="pooding_strawberry" isOnline={true} onSendMessage={() => {}} />
      <div>LogInPage</div>
    </>
  );
};

export default LogInPage;
