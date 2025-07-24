// src/pages/WaitingPage.jsx
import ModalButton from "../components/atoms/button/ModalButton";
import BasicButton from "../components/atoms/button/BasicButton";
import TeamToggleButton from "../components/molecules/games/TeamToggleButton";
import RoundInfo from "../components/molecules/games/RoundInfo";
import Timer from "../components/molecules/games/Timer";
import SelfCamera from "../components/molecules/waiting/SelfCamera";
import WaitingUserList from "../components/organisms/waiting/WaitingUserList";
import bgImage from "../assets/background/background_waiting.png";
import ChatBox from "../components/molecules/common/ChatBox";

import { useState, useEffect } from "react";

// 실제로는 안쓰는 더미 데이터
const dummyUsers = [
  {
    id: "u1",
    username: "Pookie",
    character: "", // 혹은 null
    team: "red",
    isReady: true,
    isHost: true,
  },
  {
    id: "u2",
    username: "Choco",
    character: "", // 또는 null
    team: "blue",
    isReady: false,
    isHost: false,
  },
  {
    id: "u3",
    username: "Banana",
    character: "", // 또는 null
    team: "red",
    isReady: true,
    isHost: false,
  },
];

const WaitingPage = () => {
  const [userSlots, setUserSlots] = useState([
    null,
    null,
    null,
    null,
    null,
    null,
  ]);

  // 테스트용
  useEffect(() => {
    // 테스트: 첫 유저 1초 후 입장, 두 번째는 2초, 세 번째는 3초 후 입장
    dummyUsers.forEach((user, i) => {
      setTimeout(
        () => {
          setUserSlots((prev) => {
            const next = [...prev];
            const emptyIndex = next.findIndex((slot) => slot === null);

            // 이미 입장한 유저가 다시 들어오지 않도록 확인
            const alreadyExists = next.some((slot) => slot?.id === user.id);
            if (emptyIndex !== -1 && !alreadyExists) {
              next[emptyIndex] = user;
            }

            return next;
          });
        },
        (i + 1) * 1000
      );
    });
  }, []);

  return (
    // 1. 전체 페이지를 flex로 설정하여 세로 방향으로 정렬
    <div className="flex flex-row h-screen">
      {/* 좌측 전체 박스 */}
      <section
        className="basis-3/4 flex flex-col"
        style={{
          backgroundImage: `url(${bgImage})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
        }}
      >
        {/* 상하 박스    위: 방제, 버튼 */}
        <div className="basis-1/5 flex flex-row justify-between items-center">
          <h1 className="p-4">room_list</h1>
          <div className="flex flex-row gap-2 p-2">
            <BasicButton>team</BasicButton>
            <ModalButton>READY</ModalButton>
          </div>
        </div>

        {/* 아래: 유저 카드 리스트 */}
        <div className="basis-4/5">
          <div
            className="h-full bg-transparent flex flex-col items-stretch justify-center
        "
          >
            <WaitingUserList userSlots={userSlots} />
          </div>
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

        <SelfCamera />
        <div>chat components</div>
        <ChatBox className="h-60"></ChatBox>
      </section>
    </div>
  );
};

export default WaitingPage;
