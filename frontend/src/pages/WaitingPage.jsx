// src/pages/WaitingPage.jsx
import ModalButton from "../components/atoms/button/ModalButton";
import TeamToggleButton from "../components/molecules/games/TeamToggleButton";
import SelfCamera from "../components/molecules/waiting/SelfCamera";
import WaitingUserList from "../components/organisms/waiting/WaitingUserList";
import bgImage from "../assets/background/background_waiting.png";
import ChatBox from "../components/molecules/common/ChatBox";
import RoomExitModal from "../components/organisms/waiting/RoomExitModal";
import KickConfirmModal from "../components/organisms/waiting/KickConfirmModal";

import { useNavigate, useParams } from "react-router-dom";
import { useState, useEffect } from "react";
import { getSocket, closeSocket } from "../sockets/common/websocket";
import {
  emitTeamChange,
  emitReadyChange,
  emitLeaveRoom,
  emitStartGame,
  emitForceRemove,
} from "../sockets/waiting/emit";
import { handleWaitingMessage } from "../sockets/waiting/onMessage";
import useAuthStore from "../store/store";

const WaitingPage = () => {
  const navigate = useNavigate();
  const { roomId } = useParams();
  const user = useAuthStore((state) => state.user);
  const accessToken = useAuthStore((state) => state.accessToken);

  const [room, setRoom] = useState(null);
  const [team, setTeam] = useState(null);
  const [isReady, setIsReady] = useState(false);
  const [isExitModalOpen, setIsExitModalOpen] = useState(false);
  const [kickModalOpen, setKickModalOpen] = useState(false); // 모달 열림
  const [kickTarget, setKickTarget] = useState(null); // 강퇴 대상 유저 정보
  const isHost = room?.master?.id === user?.id; // 방장 누구니니

  // 진입 시 accessToken 없으면 refresh로 재발급 시도
  useEffect(() => {
    if (!accessToken) {
      useAuthStore.getState().loadUserFromStorage();
    }
  }, [accessToken]);

  // 토큰 check하고
  //   console.log("token", accessToken);

  // accessToken 있으면 소켓 연결 시도
  useEffect(() => {
    if (!accessToken || !user) return;

    const socket = getSocket();
    if (!socket || socket.readyState !== WebSocket.OPEN) {
      console.warn("WebSocket이 열려 있지 않음");
      return;
    }

    const handleMessage = (e) => {
      try {
        const data = JSON.parse(e.data);
        handleWaitingMessage(data, {
          user,
          setRoom,
          setTeam,
          setIsReady,
          navigate,
        });
      } catch (err) {
        console.error("소켓 메시지 처리 중 오류:", err);
      }
    };

    // 서버로 부터 메시지를 받았을때 "message"라는 이벤트 발생 handleMessage 함수 실행
    // 이벤트 리스너를 활용해서 여러 핸들러 등록 가능
    socket.addEventListener("message", handleMessage);
    return () => socket.removeEventListener("message", handleMessage);
  }, [accessToken, user]);

  const handleLeaveRoom = () => {
    emitLeaveRoom({ roomId });
    closeSocket();
    navigate("/home");
  };

  const handleStartGame = () => {
    emitStartGame({ roomId });
  };

  const handleTeamToggle = () => {
    const toTeam = team === "RED" ? "BLUE" : "RED";
    console.log("emitTeamChange 실행:", toTeam);
    emitTeamChange({ roomId, curTeam: toTeam });
  };

  const handleReadyToggle = () => {
    emitReadyChange({ roomId, team });
    setIsReady(!isReady);
  };

  const handleKickConfirm = () => {
    emitForceRemove({
      roomId,
      removeTargetId: kickTarget.userId,
      removeTargetNickname: kickTarget.userNickname,
      removeTargetTeam: kickTarget.team,
    });
    setKickModalOpen(false);
  };

  // 유저 카드리스트 내용 빈 슬롯 미리 만들어두기
  const MAX_USERS = 6;
  const userSlots = room
    ? (() => {
        const combinedUsers = [...room.RED, ...room.BLUE].map((u) => ({
          userId: u.id,
          userNickname: u.nickname,
          team: room.RED.some((r) => r.id === u.id) ? "red" : "blue",
          isReady: u.status === "READY",
          isHost: room.master?.id === u.id,
          reqImg: u.repImg,
        }));

        while (combinedUsers.length < MAX_USERS) {
          combinedUsers.push(null);
        }

        return combinedUsers;
      })()
    : Array(MAX_USERS).fill(null); // room이 아직 없으면 빈 슬롯 6개

  // START 버튼 활성화 조건
  const isStartEnabled =
    isHost &&
    room?.RED.length > 0 &&
    room?.RED.length === room?.BLUE.length &&
    [...room.RED, ...room.BLUE].every((u) => u.status === "READY");

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
          <h1 className="p-4 text-3xl">{room?.title ?? "room_title"}</h1>
          <div className="flex flex-row gap-2 p-2 items-center">
            <TeamToggleButton currentTeam={team} onClick={handleTeamToggle} />
            {isHost ? (
              <ModalButton onClick={handleStartGame} disabled={!isStartEnabled}>
                START
              </ModalButton>
            ) : (
              <ModalButton onClick={handleReadyToggle}>
                {isReady ? "준비 해제" : "준비 완료"}
              </ModalButton>
            )}
          </div>
        </div>

        {/* 유저 카드리스트 */}
        <div className="basis-4/5">
          <div className="h-full bg-transparent flex flex-col items-stretch justify-center">
            <WaitingUserList
              userSlots={userSlots}
              roomMasterId={room?.master?.id}
              onRightClickKick={(user) => {
                setKickTarget(user);
                setKickModalOpen(true);
              }}
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

        <div className="basis-4/8 relative flex justify-center items-center">
          <div className="absolute bottom-0">
            <ChatBox className="w-full" height="300px" />
          </div>
        </div>
      </section>

      <RoomExitModal
        isOpen={isExitModalOpen}
        onConfirm={handleLeaveRoom}
        onCancel={() => setIsExitModalOpen(false)}
      />
      <KickConfirmModal
        isOpen={kickModalOpen}
        kickTarget={kickTarget}
        onConfirm={handleKickConfirm}
        onCancel={() => setKickModalOpen(false)}
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
//   // useNavigate 훅을 사용한 페이지 이동 기능
//   const navigate = useNavigate();

//   // 방을 나가게 되면 socket 연결을 끊고 메인 페이지로 이동하는 함수 필요
//   const handleLeaveRoom = () => {
//     // 방 나가기 로직
//     console.log("방을 나가기");
//     // 방 나간 후 메인 페이지로 이동
//     navigate("/home");
//   };

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
//     dummyUsers.forEach((user, i) => {
//       setTimeout(
//         () => {
//           setUserSlots((prev) => {
//             const next = [...prev];
//             const emptyIndex = next.findIndex((slot) => slot === null);

//             // 이미 입장한 유저가 다시 들어오지 않도록 확인
//             const alreadyExists = next.some((slot) => slot?.id === user.id);
//             if (emptyIndex !== -1 && !alreadyExists) {
//               next[emptyIndex] = user;
//             }

//             return next;
//           });
//         },
//         (i + 1) * 1000
//       );
//     });
//   }, []);

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

//       {/* 방 나가기 모달 */}
//       <RoomExitModal
//         isOpen={isExitModalOpen}
//         onConfirm={handleLeaveRoom}
//         onCancel={() => setIsExitModalOpen(false)}
//       />
//     </div>
//   );
// };

// export default WaitingPage;
