// src/pages/WaitingPage.jsx

// 방정보 받아오기 위해서서
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import handleWaitingMessage from "../sockets/waiting/handleWaitingMessage";
import { getSocket, updateHandlers } from "../sockets/websocket";

import ModalButton from "../components/atoms/button/ModalButton";
import TeamToggleButton from "../components/molecules/waiting/TeamToggleButton";
import SelfCamera from "../components/molecules/waiting/SelfCamera";
import WaitingUserList from "../components/organisms/waiting/WaitingUserList";
import bgImage from "../assets/background/background_waiting.png";
import bgSamePose from "../assets/background/background_samepose.gif";
import bgSilentScream from "../assets/background/background_silentscream.gif";
import bgSketchRelay from "../assets/background/background_sketchrelay.gif";
import ChatBox from "../components/molecules/common/ChatBox";
import RoomExitModal from "../components/organisms/waiting/RoomExitModal";
import KickConfirmModal from "../components/organisms/waiting/KickConfirmModal";
import GameTypeToggleButton from "../components/organisms/waiting/GameTypeToggleButton";
import characterImageMap from "../utils/characterImageMap";
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
  const [alertMessage, setAlertMessage] = useState("");
  const [alertVisible, setAlertVisible] = useState(false);

  const isHost = room?.master?.id === user?.userAccountId;

  const { roomId } = useParams();
  const setRoomId = useGameStore((state) => state.setRoomId);

  const getBackgroundImageByGameType = (type) => {
    switch (type) {
      case "SAMEPOSE":
        return bgSamePose;
      case "SILENTSCREAM":
        return bgSilentScream;
      case "SKETCHRELAY":
        return bgSketchRelay;
      default:
        return bgImage; // 기본 배경
    }
  };

  useEffect(() => {
    if (!roomId) return;
    setRoomId(roomId);
  }, [roomId, setRoomId]);

  useEffect(() => {
    const isActualBrowserRefresh = () => {
      // Performance Navigation API로 새로고침 감지
      let isReloadType = false;
      if (
        performance.navigation &&
        performance.navigation.type === performance.navigation.TYPE_RELOAD
      ) {
        isReloadType = true;
      }

      const navigationEntries = performance.getEntriesByType("navigation");
      if (!isReloadType && navigationEntries.length > 0) {
        const navEntry = navigationEntries[0];
        isReloadType = navEntry.type === "reload";
      }

      // sessionStorage로 정상 입장 여부 확인
      const isNormalEntry =
        sessionStorage.getItem("waitingPageNormalEntry") === "true";

      return isReloadType && !isNormalEntry;
    };

    if (isActualBrowserRefresh()) {
      console.log("🔄 브라우저 새로고침 감지 - 상태 초기화 후 로비로 이동");
      // 로비로 이동
      navigate("/home", { replace: true });
      return;
    }

    // 정상 입장 표시 제거 (한 번만 사용)
    sessionStorage.removeItem("waitingPageNormalEntry");
  }, [navigate]);

  // ❗ 새로고침(F5, Ctrl+R) 또는 뒤로가기 시 모달 띄우기 기능 (기본 비활성화)

  // useEffect(() => {
  //   window.history.pushState(null, "", location.pathname);

  //   const handlePopState = (e) => {
  //     e.preventDefault();
  //     console.log("🔙 뒤로가기 감지됨");
  //     setIsExitModalOpen(true);
  //     window.history.pushState(null, "", location.pathname);
  //   };

  //   const handleKeyDown = (e) => {
  //     if (e.key === "F5" || (e.ctrlKey && e.key.toLowerCase() === "r")) {
  //       e.preventDefault();
  //       console.log("🔄 새로고침 감지됨");
  //       setIsExitModalOpen(true);
  //     }
  //   };

  //   window.addEventListener("popstate", handlePopState);
  //   window.addEventListener("keydown", handleKeyDown);

  //   return () => {
  //     window.removeEventListener("popstate", handlePopState);
  //     window.removeEventListener("keydown", handleKeyDown);
  //   };
  // }, [location.pathname]);

  // WebSocket 메시지 수신 처리
  useEffect(() => {
    if (!user) return;

    // waiting 관련 핸들러 업데이트
    updateHandlers({
      user,
      room,
      setRoom,
      setTeam,
      setIsReady,
      navigate,
    });

    return () => {
      // 컴포넌트 언마운트 시 핸들러 정리
      updateHandlers({
        user: null,
        room: null,
        setRoom: () => {},
        setTeam: () => {},
        setIsReady: () => {},
      });
    };
  }, [user, room, navigate]);

  // 팀, 준비 관련
  useEffect(() => {
    if (!room || !user) return;

    const myTeam = room.RED.some((u) => u.id === user.userAccountId)
      ? "RED"
      : room.BLUE.some((u) => u.id === user.userAccountId)
        ? "BLUE"
        : null;

    setTeam(myTeam);

    const me = room[myTeam]?.find((u) => u.id === user.userAccountId);
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
        console.log("room", room);
        const allUsers = [...room.RED, ...room.BLUE];

        //  그대로 순서대로 카드 정보 생성
        const combinedUsers = allUsers.map((u) => ({
          userId: u.id,
          userNickname: u.nickname,
          team: room.RED.some((r) => r.id === u.id) ? "red" : "blue",
          isReady: u.status === "READY",
          isHost: room.master?.id === u.id,
          repImg: characterImageMap[u?.repCharacter?.characterName] ?? characterImageMap.default,
        }));

        // 빈 슬롯 채우기
        while (combinedUsers.length < MAX_USERS) {
          combinedUsers.push(null);
        }

        return combinedUsers;
      })()
    : Array(MAX_USERS).fill(null);

  const handleStartGameClick = () => {
    if (isStartEnabled()) {
      handleStartGame();
    }
  };

  // 게임 스타트 시 조건 충족 하지 못할 시 띄울 모달
  const showTemporaryAlert = (message) => {
    setAlertMessage(message);
    setAlertVisible(true);

    setTimeout(() => {
      setAlertVisible(false);
      setAlertMessage("");
    }, 1000);
  };

  // 게임 시작 버튼 활성화 조건
  const isStartEnabled = () => {
    const redCount = room?.RED.length || 0;
    const blueCount = room?.BLUE.length || 0;
    const allUsers = [...(room?.RED || []), ...(room?.BLUE || [])];
    const allReady = allUsers.every((u) => u.status === "READY");

    if (redCount !== 3 || blueCount !== 3) {
      showTemporaryAlert("각 팀원은 3명이어야 합니다");
      return false;
    }

    if (!allReady) {
      showTemporaryAlert("게임은 6명이 모두 준비상태여야 시작할 수 있습니다");
      return false;
    }

    return true;
  };

  // UI
  return (
    <div className="flex flex-row h-screen">
      {/* 유저와 설정 관련 */}
      <section
        className="basis-3/4 flex flex-col"
        style={{
          backgroundImage: `url(${getBackgroundImageByGameType(room?.gameType)})`,
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

          <div className="basis-2/5 flex flex-row gap-4 p-2 items-center justify-end">
            <TeamToggleButton
              currentTeam={team}
              onClick={handleTeamToggle}
              disabled={!isHost && isReady}
            />
            {isHost ? (
              <ModalButton
                onClick={handleStartGameClick}
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
      {alertVisible && (
        <div className="fixed top-1/3 left-1/2 transform -translate-x-1/2 bg-[#FDE1F0] px-6 py-4 rounded-xl shadow-lg text-center z-50 animate-fade-in-out">
          <p className="text-md font-semibold">{alertMessage}</p>
        </div>
      )}
    </div>
  );
};

export default WaitingPage;
