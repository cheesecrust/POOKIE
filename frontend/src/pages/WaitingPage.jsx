// src/pages/WaitingPage.jsx

// 방정보 받아오기 위해서서
import { useLocation, useNavigate } from "react-router-dom";
import { useEffect, useState,useParams } from "react";
import handleWaitingMessage from "../sockets/waiting/handleWaitingMessage";
import { getSocket } from "../sockets/websocket";

import ModalButton from "../components/atoms/button/ModalButton";
import TeamToggleButton from "../components/molecules/waiting/TeamToggleButton";
import SelfCamera from "../components/molecules/waiting/SelfCamera";
import WaitingUserList from "../components/organisms/waiting/WaitingUserList";
import bgImage from "../assets/background/background_waiting.png";
import ChatBox from "../components/molecules/common/ChatBox";
import RoomExitModal from "../components/organisms/waiting/RoomExitModal";
import KickConfirmModal from "../components/organisms/waiting/KickConfirmModal";
import GameTypeToggleButton from "../components/organisms/waiting/GameTypeToggleButton";
import useAuthStore from "../store/useAuthStore";
import useGameStore from "../store/useGameStore";
import {
  emitTeamChange,
  emitReadyChange,
  emitLeaveRoom,
  emitStartGame,
  emitForceRemove,
  emitGameTypeChange,
} from "../sockets/waiting/emit";

const WaitingPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [room, setRoom] = useState(location.state?.room);
  const user = useAuthStore((state) => state.user);

  const [team, setTeam] = useState(null);
  const [isReady, setIsReady] = useState(false);
  const [isExitModalOpen, setIsExitModalOpen] = useState(false);
  const [kickModalOpen, setKickModalOpen] = useState(false);
  const [kickTarget, setKickTarget] = useState(null);


  const isHost = room?.master?.id === user?.id;

  const {roomId} = useParams();
  const setRoomId = useGameStore((state) => state.setRoomId);
  useEffect(()=> {
    if (!roomId) return;
    setRoomId(roomId); 
    }, [roomId,setRoomId]);

  // WebSocket 메시지 수신 처리
  useEffect(() => {
    const socket = getSocket();
    if (!socket || !user) return;

    const handleMessage = (e) => {
      try {
        const msg = JSON.parse(e.data);
        handleWaitingMessage(msg, {
          user,
          room,
          setRoom,
          setTeam,
          setIsReady,
          navigate,
        });
      } catch (err) {
        console.error("[WaitingPage] WebSocket 메시지 파싱 실패", err);
      }
    };

    socket.addEventListener("message", handleMessage);
    return () => socket.removeEventListener("message", handleMessage); // 중복 안되도록 클린업
  }, [user, room, navigate]);

  // 팀, 준비 관련
  useEffect(() => {
    if (!room || !user) return;

    const myTeam = room.RED.some((u) => u.id === user.id)
      ? "RED"
      : room.BLUE.some((u) => u.id === user.id)
        ? "BLUE"
        : null;

    setTeam(myTeam);

    const me = room[myTeam]?.find((u) => u.id === user.id);
    setIsReady(me?.status === "READY");
  }, [room, user]);

  // emit & navigate 로직
  // 방 나가기
  const handleLeaveRoom = () => emitLeaveRoom({ roomId: room.id });

  // 게임 시작
  const handleStartGame = () => {
    emitStartGame({ roomId: room.id });
  };

  // 팀 변경
  const handleTeamToggle = () => {
    if (!team) return;
    emitTeamChange({ roomId: room.id, curTeam: team });
  };

  // 준비 변경
  const handleReadyToggle = () => {
    emitReadyChange({ roomId: room.id, team });
    setIsReady(!isReady);
  };

  // 강퇴 (네)누르면
  const handleKickConfirm = () => {
    emitForceRemove({
      roomId: room.id,
      removeTargetId: kickTarget.userId,
      removeTargetNickname: kickTarget.userNickname,
      removeTargetTeam: kickTarget.team.toUpperCase(),
    });
    setKickModalOpen(false);
  };

  // 게임 타입 변경
  const handleGameTypeChange = (selectedType) => {
    if (selectedType !== room?.gameType) {
      emitGameTypeChange({ roomId: room.id, requestGameType: selectedType });
    }
  };

  // 유저 카드 리스트
  const MAX_USERS = 6;
  const userSlots = room
    ? (() => {
        // RED와 BLUE를 그대로 합침 (순서 보존)
        const allUsers = [...room.RED, ...room.BLUE];

        //  그대로 순서대로 카드 정보 생성
        const combinedUsers = allUsers.map((u) => ({
          userId: u.id,
          userNickname: u.nickname,
          team: room.RED.some((r) => r.id === u.id) ? "red" : "blue",
          isReady: u.status === "READY",
          isHost: room.master?.id === u.id,
          repImg: u.repImg,
        }));

        // 빈 슬롯 채우기
        while (combinedUsers.length < MAX_USERS) {
          combinedUsers.push(null);
        }

        return combinedUsers;
      })()
    : Array(MAX_USERS).fill(null);

  // 게임 시작 버튼 활성화 조건
  const isStartEnabled =
    isHost &&
    room?.RED.length === 3 &&
    room?.BLUE.length === 3 &&
    [...room.RED, ...room.BLUE].every((u) => u.status === "READY");

  // UI
  return (
    <div className="flex flex-row h-screen">
      {/* 유저와 설정 관련 */}
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
          <div className="flex flex-row gap-6 p-2 justify-around items-center">
            <h1 className="p-4 text-3xl w-[200px]">
              {room?.title ?? "room_title"}
            </h1>
            <h1 className="p-4 text-xl">
              {(room?.RED?.length ?? 0) + (room?.BLUE?.length ?? 0)}/6 명
            </h1>
            <p className=" text-sm">게임 선택:</p>

            {/* 게임 타입 토글 버튼 */}
            <GameTypeToggleButton
              gameType={room?.gameType}
              onToggle={handleGameTypeChange}
              isHost={isHost}
            />
          </div>

          <div className="flex flex-row gap-4 p-2 items-center">
            <TeamToggleButton currentTeam={team} onClick={handleTeamToggle} />
            {isHost ? (
              <ModalButton
                onClick={handleStartGame}
                disabled={!isStartEnabled}
                className="text-lg px-6 py-3 w-37 h-15 rounded-xl"
              >
                START
              </ModalButton>
            ) : (
              <ModalButton
                onClick={handleReadyToggle}
                className="text-md px-6 py-3 w-37 h-15 rounded-xl"
              >
                {isReady ? "준비 해제" : "준비 완료"}
              </ModalButton>
            )}
          </div>
        </div>

        <div className="basis-4/5">
          <div className="h-full bg-transparent flex flex-col items-stretch justify-around">
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

      {/* 채팅과 카메라 */}
      <section className="basis-1/4 flex flex-col bg-rose-300">
        <div className="basis-1/8 m-4 flex justify-end items-center">
          <ModalButton
            className="text-lg px-2 py-1 rounded-md w-37 h-15"
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
            <ChatBox
              className="w-full"
              height="300px"
              roomId={room.id}
              team={team}
            />
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
