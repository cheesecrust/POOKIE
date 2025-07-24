import ChatBox from "../components/molecules/common/ChatBox";

const LogInPage = () => {
  return (
    <>
      <div>LogInPage</div>

      <div style={{ width: '1000px', height: '1000px', position: 'relative', backgroundColor: '#f8f8f8' }}>
        <div style={{ position: 'absolute', bottom: '0', left: 0, right: 0 }}>
          <ChatBox />
        </div>
      </div>
    </>
  );
};

export default LogInPage;