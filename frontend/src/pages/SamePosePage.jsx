// src/pages/SamePosePage.jsx

import RoundInfo from "../components/molecules/games/RoundInfo";
import toggle_left from "../assets/icon/toggle_left.png";
import ChatBox from "../components/molecules/common/ChatBox";
import PopUpModal from "../components/atoms/modal/PopUpModal";
import background_same_pose from "../assets/background/background_samepose.gif";
import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";

import useAuthStore from "../store/useAuthStore.js";
import useGameStore from "../store/useGameStore";
import { Room, RoomEvent, createLocalVideoTrack } from "livekit-client";
import LiveKitVideo from "../components/organisms/common/LiveKitVideo";

import {
  emitAnswerSubmit,
  emitTurnOver,
  emitRoundOver,
  emitTimerStart,
} from "../sockets/game/emit.js";

const SamePosePage = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();

  // 방정보
  const master = useGameStore((state) => state.master);
  const myIdx = user?.userAccountId;
  const roomId = useGameStore((state) => state.roomId);
  const roomInfo = useGameStore((state) => state.roomInfo);

  // 턴 라운드 키워드
  const turn = useGameStore((state) => state.turn);
  const round = useGameStore((state) => state.round);

  // 제시어어
  const keywordIdx = useGameStore((state) => state.keywordIdx);
  const keywordList = useGameStore((state) => state.keywordList);
  const keyword = keywordList?.[keywordIdx] ?? "";
  //타이머
  const isTimerEnd = useGameStore((state) => state.isTimerEnd);
  const resetGameTimerEnd = useGameStore((state) => state.resetIsTimerEnd);
  const turnTimeLeft = useGameStore((state) => state.turnTimeLeft);
  const timeLeft = useGameStore((state) => state.timeLeft);

  // 팀 구분
  const [redTeam, setRedTeam] = useState([]);
  const [blueTeam, setBlueTeam] = useState([]);
  const [publisherTrack, setPublisherTrack] = useState(null);

  // 점수 관련
  const teamScore = useGameStore((state) => state.teamScore);
  const tempTeamScore = useGameStore((state) => state.tempTeamScore);
  const roundResult = useGameStore((state) => state.roundResult);
  const gameResult = useGameStore((state) => state.gameResult);
  const score = useGameStore((state) => state.score); // 현재라운드 현재 팀 점수

  // 최종 승자
  const win = useGameStore((state) => state.win);

  // 모달
  const isGameStartModalOpen = useGameStore(
    (state) => state.isGamestartModalOpen
  );
  const isTurnModalOpen = useGameStore((state) => state.isTurnModalOpen);
  const closeGameStartModal = useGameStore(
    (state) => state.closeGamestartModal
  );
  const closeTurnModal = useGameStore((state) => state.closeTurnModal);
  const showTurnChangeModal = useGameStore(
    (state) => state.showTurnChangeModal
  ); // 턴 바뀔때 모달

  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);
  const [isWinModalOpen, setIsWinModalOpen] = useState(false);

  // 첫 시작 모달
  const handleTimerPrepareSequence = useGameStore(
    (state) => state.handleTimerPrepareSequence
  );

  const [isTimerOpen, setIsTimerOpen] = useState(true);
  const [isFirstLoad, setIsFirstLoad] = useState(true); // 첫 시작인지를 판단

  // 팀끼리 사진 캡쳐
  const handleCapture = () => {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");

    const targetTracks =
      turn === "RED"
        ? [
            ...(publisherTrack?.team === "RED" ? [publisherTrack] : []),
            ...redTeam,
          ]
        : [
            ...(publisherTrack?.team === "BLUE" ? [publisherTrack] : []),
            ...blueTeam,
          ];

    targetTracks.forEach((p) => {
      const videoEl = document.createElement("video");
      videoEl.srcObject = new MediaStream([p.track.mediaStreamTrack]);
      videoEl.play();

      videoEl.onloadeddata = () => {
        canvas.width = videoEl.videoWidth;
        canvas.height = videoEl.videoHeight;
        ctx.drawImage(videoEl, 0, 0, canvas.width, canvas.height);

        const imgData = canvas.toDataURL("image/png");
        const a = document.createElement("a");
        a.href = imgData;
        a.download = `${p.nickname}_capture.png`;
        a.click();
      };
    });
  };

  // 1️ 첫 페이지 로딩
  useEffect(() => {
    handleTimerPrepareSequence(roomId);
  }, [roomId]);

  // 턴 바뀔 때 턴 모달 띄움
  useEffect(() => {
    // 첫 로딩(게임 시작) 제외
    if (!isFirstLoad) {
      showTurnChangeModal();
    } else {
      setIsFirstLoad(false);
    }
  }, [turn]);

  // turn 변환 (레드팀 -> 블루팀), 라운드 변환 (블루 -> 레드)
  useEffect(() => {
    if (myIdx === master)
      if (keywordIdx >= 15)
        if (turn === "RED") {
          emitTurnOver({ roomId, team: turn, score: score });
        } else if (turn === "BLUE") {
          emitRoundOver({ roomId, team: turn, score: score });
        }
    // 추가 조건 : 타이머 끝났을 때
    if (isTimerEnd) {
      if (turn === "RED") {
        emitTurnOver({ roomId, team: turn, score: score });
        emitTimerStart({ roomId });
      } else if (turn === "BLUE") {
        emitRoundOver({ roomId, team: turn, score: score });
        emitTimerStart({ roomId });
      }
      resetGameTimerEnd();
    }
  }, [keywordIdx, isTimerEnd]);

  // 최종 누가 이겼는지
  useEffect(() => {
    if (win) {
      setIsWinModalOpen(true);
      const timeout = setTimeout(() => {
        navigate(`/waiting/${roomId}`, { state: { room: roomInfo } });
      }, 7000);

      return () => clearTimeout(timeout);
    }
  }, [win]);
  // livekit 연결
  // useEffect(() => {
  //   const connectLiveKit = async () => {
  //     try {
  //       const livekitUrl = import.meta.env.VITE_OPENVIDU_LIVEKIT_URL;
  //       const token = useGameStore.getState().rtc_token;
  //       if (!token) {
  //         console.error("❌ RTC Token이 없습니다.");
  //         return;
  //       }

  //       const newRoom = new Room();
  //       await newRoom.connect(livekitUrl, token);
  //       console.log("✅ LiveKit 연결 성공");

  //       // 로컬 캠 시작
  //       const videoTrack = await createLocalVideoTrack();
  //       await newRoom.localParticipant.publishTrack(videoTrack);
  //       setPublisherTrack({
  //         track: videoTrack,
  //         identity: user.id,
  //         nickname: user.userNickname,
  //         team: user.team,
  //       });

  //       roomRef.current = newRoom;

  //       const handleTrackSubscribed = (track, publication, participant) => {
  //         // 🔇 오디오 트랙은 바로 끄기
  //         if (track.kind === "audio") {
  //           track.enabled = false;
  //           return;
  //         }
  //         if (!participant || participant.isLocal) return;

  //         const nickname = participant.metadata?.nickname || "unknown";
  //         const team = participant.metadata?.team || "RED";
  //         const newParticipant = {
  //           track,
  //           identity: participant.identity,
  //           nickname,
  //           team,
  //         };

  //         if (team === "RED") {
  //           setRedTeam((prev) =>
  //             prev.some((p) => p.identity === participant.identity)
  //               ? prev
  //               : [...prev, newParticipant]
  //           );
  //         } else {
  //           setBlueTeam((prev) =>
  //             prev.some((p) => p.identity === participant.identity)
  //               ? prev
  //               : [...prev, newParticipant]
  //           );
  //         }
  //       };

  //       // 기존 참가자 처리
  //       for (const participant of newRoom.remoteParticipants.values()) {
  //         for (const publication of participant.trackPublications.values()) {
  //           if (
  //             publication.isSubscribed &&
  //             publication.track?.kind === "video"
  //           ) {
  //             handleTrackSubscribed(
  //               publication.track,
  //               publication,
  //               participant
  //             );
  //           }
  //         }
  //         participant.on(RoomEvent.TrackSubscribed, (track, publication) => {
  //           handleTrackSubscribed(track, publication, participant);
  //         });
  //       }

  //       // 새 참가자 처리
  //       newRoom.on(RoomEvent.ParticipantConnected, (participant) => {
  //         participant.on(RoomEvent.TrackSubscribed, (track, publication) => {
  //           handleTrackSubscribed(track, publication, participant);
  //         });
  //       });

  //       // 참가자 퇴장 처리
  //       newRoom.on(RoomEvent.ParticipantDisconnected, (participant) => {
  //         setRedTeam((prev) =>
  //           prev.filter((p) => p.identity !== participant.identity)
  //         );
  //         setBlueTeam((prev) =>
  //           prev.filter((p) => p.identity !== participant.identity)
  //         );
  //       });
  //     } catch (error) {
  //       console.error("LiveKit 연결 실패:", error);
  //     }
  //   };

  //   connectLiveKit();
  // }, []);

  // // 턴 변경 시 반대 팀 음소거 처리
  // useEffect(() => {
  //   if (!roomRef.current) return;
  //   for (const participant of roomRef.current.remoteParticipants.values()) {
  //     const team = participant.metadata?.team;
  //     const shouldMute = turn === "RED" ? team === "BLUE" : team === "RED";
  //     participant.audioTracks.forEach((pub) => {
  //       if (pub.track) pub.track.enabled = !shouldMute;
  //     });
  //   }
  // }, [turn]);

  return (
    <div
      className="flex flex-col h-screen bg-cover bg-center"
      style={{ backgroundImage: `url(${background_same_pose})` }}
    >
      <section className="basis-3/9 flex flex-col p-4">
        <div className="flex flex-row flex-1 items-center justify-between px-6">
          <div className="flex flex-col text-sm text-gray-700 leading-tight w-[160px]">
            <span className="mb-2">제시어에 맞게 동작을 취하세요</span>
            <span className="text-xs">
              최대한 <b className="text-pink-500">정자세</b>에서 정확한 동작을
              취해주세요.
            </span>
            {/* <button
              onClick={handleCapture}
              className="w-40 h-20 bg-yellow-400 rounded hover:bg-yellow-500"
            >
              📸 사진 찰칵{" "}
            </button> */}
          </div>

          <div>
            {/* 턴정보 */}
            <div className="text-center text-2xl">{`${turn} TEAM TURN`}</div>
            {/* 제시어 */}
            <div className="flex flex-col items-center justify-center bg-[#FFDBF7] rounded-xl shadow-lg w-[400px] h-[170px] gap-5 ">
              <div className="text-2xl text-pink-500 font-bold flex flex-row items-center">
                <img src={toggle_left} alt="icon" className="w-5 h-5 mr-2" />
                <p>제시어</p>
              </div>
              <p className="text-2xl font-semibold text-black mt-2">
                {keyword || "상대 팀 진행 중..."}
              </p>
            </div>
          </div>

          <RoundInfo
            round={round}
            redScore={teamScore?.RED}
            blueScore={teamScore?.BLUE}
          />
        </div>
      </section>

      {/* 3:3 화면 구성 */}
      <section className="basis-4/9 flex flex-row gap-6 bg-red-100 p-4 justify-center items-center">
        {" "}
        {/* RED TEAM */}
        {/* <div className="flex flex-wrap justify-center w-full bg-red-100 p-2">
          {publisherTrack?.team === "RED" && (
            <LiveKitVideo
              videoTrack={publisherTrack.track}
              isLocal={true}
              nickname={publisherTrack.nickname}
              containerClassName="w-40 h-32 border border-red-500 m-1"
            />
          )}
          {redTeam.map((p) => (
            <LiveKitVideo
              key={p.identity}
              videoTrack={p.track}
              isLocal={false}
              nickname={p.nickname}
              containerClassName="w-40 h-32 border border-red-500 m-1"
            />
          ))}
        </div> */}
        <div className="flex-1 h-full border border-red-500 bg-blue-300 rounded-lg"></div>
        <div className="flex-1 h-full border border-red-500 bg-green-300 rounded-lg"></div>
        <div className="flex-1 h-full border border-red-500 bg-yellow-300 rounded-lg"></div>
      </section>

      <section className="basis-3/9 flex flex-row">
        <div className="relative basis-1/3 ">
          <div className="absolute bottom-0 left-0 ">
            <ChatBox width="350px" height="250px" />
          </div>
        </div>

        {/* BLUE TEAM */}
        <section className="basis-2/3 flex flex-wrap gap-6 bg-blue-100 p-4 justify-center items-center">
          <div className="flex-1 h-full border border-blue-500 bg-blue-300 rounded-lg"></div>
          <div className="flex-1 h-full border border-blue-500 bg-green-300 rounded-lg"></div>
          <div className="flex-1 h-full border border-blue-500 bg-yellow-300 rounded-lg"></div>

          {/* {publisherTrack?.team === "BLUE" && (
            <LiveKitVideo
              videoTrack={publisherTrack.track}
              isLocal={true}
              nickname={publisherTrack.nickname}
              containerClassName="w-40 h-32 border border-blue-500 m-1"
            />
          )} */}
          {/* {blueTeam.map((p) => (
            <LiveKitVideo
              key={p.identity}
              videoTrack={p.track}
              isLocal={false}
              nickname={p.nickname}
              containerClassName="w-40 h-32 border border-blue-500 m-1"
            />
          ))} */}
        </section>
      </section>

      {/* 관련 */}

      {/* 제출 모달은 동작이 맞았으면 true로 판단해서 true ? ${keyword}:"wrong"
const inputAnswer = true ? ${keyword}:"wrong"
 자동으로 제시어가 제출됨
emitAnswerSubmit({
  roomId,
  round,
    norId,
   keywordIdx,
   inputAnswer,
 }); */}

      {/* GAME START 모달 */}
      <PopUpModal
        isOpen={isGameStartModalOpen}
        onClose={() => closeGameStartModal()}
      >
        <p className="text-6xl font-bold font-pixel">GAME START</p>
      </PopUpModal>

      {/* GAME START 모달 */}
      <PopUpModal
        isOpen={isGameStartModalOpen}
        onClose={() => closeGameStartModal()}
      >
        <p className="text-6xl font-bold font-pixel">GAME START</p>
      </PopUpModal>

      {/* 최종 승자 모달 */}
      <PopUpModal
        isOpen={isWinModalOpen}
        onClose={() => setIsWinModalOpen(false)}
      >
        <p className="text-6xl font-bold font-pixel">
          {(win === "DRAW" && "DRAW!") ||
            (win === "RED" && "RED TEAM WIN!") ||
            (win === "BLUE" && "BLUE TEAM WIN!")}
        </p>
      </PopUpModal>

      {/* 턴 모달 */}
      <PopUpModal isOpen={isTurnModalOpen} onClose={() => closeTurnModal()}>
        <p className="text-6xl font-bold font-pixel">
          {turn === "RED" ? "RED TEAM TURN" : "BLUE TEAM TURN"}
        </p>
      </PopUpModal>
    </div>
  );
};

export default SamePosePage;
