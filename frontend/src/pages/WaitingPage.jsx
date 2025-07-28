// src/pages/WaitingPage.jsx
import ModalButton from "../components/atoms/button/ModalButton";
import BasicButton from "../components/atoms/button/BasicButton";
import SelfCamera from "../components/molecules/waiting/SelfCamera";
import WaitingUserList from "../components/organisms/waiting/WaitingUserList";
import bgImage from "../assets/background/background_waiting.png";
import ChatBox from "../components/molecules/common/ChatBox";
import RoomExitModal from "../components/organisms/waiting/RoomExitModal";

import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import {
  connectSocket,
  closeSocket,
  sendMessage,
} from "../sockets/common/websocket";
import {
  emitTeamChange,
  emitReadyChange,
  emitLeaveRoom,
} from "../sockets/games/samePose/emit";

const WaitingPage = () => {
  const navigate = useNavigate();
  const [room, setRoom] = useState(null);
  const [team, setTeam] = useState(null);
  const [isReady, setIsReady] = useState(false);
  const [isExitModalOpen, setIsExitModalOpen] = useState(false);

  const user = {
    userId: 7,
    userNickname: "testNickname7",
  };

  const isHost = room?.roomMaster?.userId === user.userId;

  const handleTeamToggle = () => {
    const toTeam = team === "Red" ? "Blue" : "Red";
    emitTeamChange({
      roomId: room.roomId,
      fromTeam: team,
      toTeam,
      user,
    });
  };

  const handleReadyToggle = () => {
    emitReadyChange({
      roomId: room.roomId,
      team,
      ready: !isReady,
      user,
    });
  };

  const handleLeaveRoom = () => {
    emitLeaveRoom({ roomId: room.roomId, user });
    closeSocket();
    navigate("/home");
  };

  useEffect(() => {
    const token =
      "eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJ0ZXN0N0B0ZXN0LmNvbSIsInVzZXJBY2NvdW50SWQiOjcsImVtYWlsIjoidGVzdDdAdGVzdC5jb20iLCJuaWNrbmFtZSI6InRlc3ROaWNrbmFtZTciLCJ0eXBlIjoiYWNjZXNzIiwiaWF0IjoxNzUzNjc2NTA3fQ.AYZbwhp6jCsAsH_OvlHZopDrlesin1N8-z9rYeSJMf8";

    connectSocket({
      url: "wss://i13a604.p.ssafy.io/api/game",
      token,
      onMessage: (data) => {
        console.log("[WebSocket MESSAGE]", data);

        switch (data.type) {
          case "TEAM_CHANGE":
          case "USER_READY_CHANGE":
            setRoom(data.room);
            const myTeam = Object.entries(data.room.users).find(([_, users]) =>
              users.some((u) => u.userId === user.userId)
            )?.[0];
            setTeam(myTeam);
            const me = data.room.users[myTeam].find(
              (u) => u.userId === user.userId
            );
            setIsReady(me?.status === "READY");
            break;

          case "LEAVE":
            if (data.msg === "Lobby 로 돌아갑니다.") {
              closeSocket();
              navigate("/home");
            } else {
              setRoom(data.room);
            }
            break;

          case "ERROR":
            alert(data.msg);
            break;

          case "ON":
            console.log("[WebSocket CONNECTED]", data.user?.userNickname);
            break;

          default:
            console.log("[Unhandled message]", data);
        }
      },
      onOpen: () => {
        console.log("[WebSocket OPEN]");
      },
      onClose: (e) => {
        console.log("[WebSocket CLOSE]", e);
      },
      onError: (e) => {
        console.log("[WebSocket ERROR]", e);
      },
    });

    return () => {
      closeSocket();
    };
  }, []);

  return (
    <div className="flex flex-row h-screen">
      <section
        className="basis-3/4 flex flex-col"
        style={{
          backgroundImage: `url(${bgImage})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
        }}
      >
        <div className="basis-1/5 flex flex-row justify-between items-center">
          <h1 className="p-4 text-3xl">{room?.roomId ?? "room_list"}</h1>
          <div className="flex flex-row gap-2 p-2">
            <BasicButton onClick={handleTeamToggle}>팀 변경</BasicButton>
            <ModalButton onClick={handleReadyToggle}>
              {isReady ? "준비 해제" : "준비 완료"}
            </ModalButton>
          </div>
        </div>

        <div className="basis-4/5">
          <div className="h-full bg-transparent flex flex-col items-stretch justify-center">
            <WaitingUserList
              userSlots={room ? [...room.users.Red, ...room.users.Blue] : []}
            />
          </div>
        </div>
      </section>

      <section className="basis-1/4 flex flex-col bg-rose-300">
        <div className="basis-1/8 m-4 flex justify-end items-center">
          <ModalButton
            className="text-lg px-2 py-1 rounded-md"
            onClick={() => setIsExitModalOpen(true)}
          >
            방 나가기
          </ModalButton>
        </div>

        <div className="basis-3/8 flex flex-col justify-center items-center">
          <SelfCamera />
        </div>

        <div className="basis-4/8 relative">
          <div className="absolute bottom-0">
            <ChatBox width="300px" height="250px" />
          </div>
        </div>
      </section>

      <RoomExitModal
        isOpen={isExitModalOpen}
        onConfirm={handleLeaveRoom}
        onCancel={() => setIsExitModalOpen(false)}
      />
    </div>
  );
};

export default WaitingPage;

// // src/pages/WaitingPage.jsx
// import ModalButton from "../components/atoms/button/ModalButton";
// import BasicButton from "../components/atoms/button/BasicButton";
// import TeamToggleButton from "../components/molecules/games/TeamToggleButton";
// import SelfCamera from "../components/molecules/waiting/SelfCamera";
// import WaitingUserList from "../components/organisms/waiting/WaitingUserList";
// import bgImage from "../assets/background/background_waiting.png";
// import ChatBox from "../components/molecules/common/ChatBox";
// import RoomExitModal from "../components/organisms/waiting/RoomExitModal";

// import { useNavigate } from "react-router-dom";
// import { useState, useEffect } from "react";

// // 실제로는 안쓰는 더미 데이터
// const dummyUsers = [
//   {
//     id: "u1",
//     username: "Pookie",
//     character: "", // 혹은 null
//     team: "red",
//     isReady: true,
//     isHost: true,
//   },
//   {
//     id: "u2",
//     username: "Choco",
//     character: "", // 또는 null
//     team: "blue",
//     isReady: false,
//     isHost: false,
//   },
//   {
//     id: "u3",
//     username: "Banana",
//     character: "", // 또는 null
//     team: "red",
//     isReady: true,
//     isHost: false,
//   },
// ];

// // WaitingPage 컴포넌트
// const WaitingPage = () => {
// // useNavigate 훅을 사용한 페이지 이동 기능
// const navigate = useNavigate();

// // 방을 나가게 되면 socket 연결을 끊고 메인 페이지로 이동하는 함수 필요
// const handleLeaveRoom = () => {
//   // 방 나가기 로직
//   console.log("방을 나가기");
//   // 방 나간 후 메인 페이지로 이동
//   navigate("/home");
// };

//   // 방 나가기 모달 상태 관리
//   const [isExitModalOpen, setIsExitModalOpen] = useState(false);

//   // ##### 방장인 경우의 프론트 예
//   const isHost = true; // 예시로 방장인 경우

//   const handleStartGame = () => {
//     if (isHost) {
//       // 방장일 때 게임 시작 로직
//       console.log("게임 시작");
//       // 예: socket.emit('startGame');
//       navigate("/sketchrelay"); // 게임 페이지로 이동
//     } else {
//       // 방장이 아닐 때는 아무 동작도 하지 않음
//       console.log("방장이 아닙니다.");
//     }
//   };

//   // 레디 상태 버튼 누르면 사용자의 레디 상태를 서버에 보내야 함

//   const [userSlots, setUserSlots] = useState([
//     null,
//     null,
//     null,
//     null,
//     null,
//     null,
//   ]);

//   // ######### 테스트용
//   useEffect(() => {
//     // 테스트: 첫 유저 1초 후 입장, 두 번째는 2초, 세 번째는 3초 후 입장
//   dummyUsers.forEach((user, i) => {
//     setTimeout(
//       () => {
//         setUserSlots((prev) => {
//           const next = [...prev];
//           const emptyIndex = next.findIndex((slot) => slot === null);

//           // 이미 입장한 유저가 다시 들어오지 않도록 확인
//           const alreadyExists = next.some((slot) => slot?.id === user.id);
//           if (emptyIndex !== -1 && !alreadyExists) {
//             next[emptyIndex] = user;
//           }

//           return next;
//         });
//       },
//       (i + 1) * 1000
//     );
//   });
// }, []);

//   return (
//     // 1. 전체 페이지를 flex로 설정하여 세로 방향으로 정렬
//     <div className="flex flex-row h-screen">
//       {/* 좌측 전체 박스 */}
//       <section
//         className="basis-3/4 flex flex-col"
//         style={{
//           backgroundImage: `url(${bgImage})`,
//           backgroundSize: "cover",
//           backgroundPosition: "center",
//           backgroundRepeat: "no-repeat",
//         }}
//       >
//         {/* 상하 박스    위: 방제, 버튼 */}
//         <div className="basis-1/5 flex flex-row justify-between items-center">
//           <h1 className="p-4 text-3xl">room_list</h1>
//           <div className="flex flex-row gap-2 p-2">
//             <BasicButton>team</BasicButton>

//             {/* 방장이라면 start를 봐야함 */}
//             {isHost ? (
//               <ModalButton onClick={handleStartGame}>START</ModalButton>
//             ) : (
//               <ModalButton>READY</ModalButton>
//             )}
//           </div>
//         </div>

//         {/* 아래: 유저 카드 리스트 */}
//         <div className="basis-4/5">
//           <div
//             className="h-full bg-transparent flex flex-col items-stretch justify-center
//         "
//           >
//             <WaitingUserList userSlots={userSlots} />
//           </div>
//         </div>
//       </section>

//       {/* 우측 전체 박스 */}
//       <section className="basis-1/4 flex flex-col bg-rose-300">
//         <div className="basis-1/8 m-4 flex justify-end items-center">
//           <ModalButton
//             className="text-lg px-2 py-1 rounded-md"
//             onClick={() => setIsExitModalOpen(true)}
//           >
//             방 나가기
//           </ModalButton>
//         </div>

//         {/*  */}
//         <div className="basis-3/8 flex flex-col justify-center items-center">
//           <SelfCamera />
//         </div>

//         <div className="basis-4/8 relative">
//           <div className="absolute bottom-0">
//             <ChatBox width="300px" height="250px" />
//           </div>
//         </div>
//       </section>

// {/* 방 나가기 모달 */}
// <RoomExitModal
//   isOpen={isExitModalOpen}
//   onConfirm={handleLeaveRoom}
//   onCancel={() => setIsExitModalOpen(false)}
// />
//     </div>
//   );
// };

// export default WaitingPage;
