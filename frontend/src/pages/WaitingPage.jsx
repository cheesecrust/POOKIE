import ModalButton from "../components/atoms/button/ModalButton";
import BasicButton from "../components/atoms/button/BasicButton";

const WaitingPage = () => {
  return (
    // 1. 전체 페이지를 flex로 설정하여 세로 방향으로 정렬
    <div className="flex flex-row h-screen">
      {/* 좌측 전체 박스 */}
      <section className="basis-3/4 flex flex-col bg-rose-100">
        {/* 상하 박스    위: 방제, 버튼 */}
        <div className="basis-1/4 flex flex-row justify-between items-center">
          <h1 className="p-4">room_list</h1>
          <div className="flex flex-row gap-2 p-2">
            <BasicButton>team</BasicButton>
            <ModalButton>READY</ModalButton>
          </div>
        </div>
        {/* 아래: 유저 카드 리스트 */}
        <div className="basis-3/4">
          <div>cardlist</div>
        </div>
      </section>
      {/* 우측 전체 박스 */}
      <section className="basis-1/4 bg-rose-300">
        <div className="m-4 flex justify-end">
          <ModalButton
            className="
    text-sm px-2 py-1 
    sm:text-base sm:px-4 sm:py-2 
    lg:text-lg lg:px-6 lg:py-3
  "
          >
            방 나가기
          </ModalButton>
        </div>
        <div>여기에 화상 배치</div>
        <div>chat components</div>
      </section>
    </div>
  );
};

export default WaitingPage;
