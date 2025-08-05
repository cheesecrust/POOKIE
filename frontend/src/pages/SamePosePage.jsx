// src/pages/SamePosePage.jsx

import RoundInfo from "../components/molecules/games/RoundInfo";
import toggle_left from "../assets/icon/toggle_left.png";
import ChatBox from "../components/molecules/common/ChatBox";
import background_same_pose from "../assets/background/background_samepose.gif";
import { useEffect, useState, useRef } from "react";
import useAuthStore from "../store/useAuthStore.js";
import useGameStore from "../store/useGameStore";
import { Room, RoomEvent, createLocalVideoTrack } from "livekit-client";
import LiveKitVideo from "../components/organisms/common/LiveKitVideo";

import {
  emitGamePass,
  emitTurnOver,
  emitRoundOver,
  emitAnswerSubmit,
} from "../sockets/game/emit";

const SamePosePage = () => {
  const { user } = useAuthStore();
  const myIdx = user?.userAccountId;
  const roomId = useGameStore((state) => state.roomId);
  const turn = useGameStore((state) => state.turn);
  const keyword = useGameStore((state) => state.keywordList[state.keywordIdx]);
  const [redTeam, setRedTeam] = useState([]);
  const [blueTeam, setBlueTeam] = useState([]);
  const [publisherTrack, setPublisherTrack] = useState(null);

  const roomRef = useRef(null);

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

  useEffect(() => {
    const connectLiveKit = async () => {
      try {
        const livekitUrl = import.meta.env.VITE_OPENVIDU_LIVEKIT_URL;
        const token = useGameStore.getState().rtc_token;
        if (!token) {
          console.error("❌ RTC Token이 없습니다.");
          return;
        }

        const newRoom = new Room();
        await newRoom.connect(livekitUrl, token);
        console.log("✅ LiveKit 연결 성공");

        // 로컬 캠 시작
        const videoTrack = await createLocalVideoTrack();
        await newRoom.localParticipant.publishTrack(videoTrack);
        setPublisherTrack({
          track: videoTrack,
          identity: user.id,
          nickname: user.userNickname,
          team: user.team,
        });

        roomRef.current = newRoom;

        const handleTrackSubscribed = (track, publication, participant) => {
          // 🔇 오디오 트랙은 바로 끄기
          if (track.kind === "audio") {
            track.enabled = false;
            return;
          }
          if (!participant || participant.isLocal) return;

          const nickname = participant.metadata?.nickname || "unknown";
          const team = participant.metadata?.team || "RED";
          const newParticipant = {
            track,
            identity: participant.identity,
            nickname,
            team,
          };

          if (team === "RED") {
            setRedTeam((prev) =>
              prev.some((p) => p.identity === participant.identity)
                ? prev
                : [...prev, newParticipant]
            );
          } else {
            setBlueTeam((prev) =>
              prev.some((p) => p.identity === participant.identity)
                ? prev
                : [...prev, newParticipant]
            );
          }
        };

        // 기존 참가자 처리
        for (const participant of newRoom.remoteParticipants.values()) {
          for (const publication of participant.trackPublications.values()) {
            if (
              publication.isSubscribed &&
              publication.track?.kind === "video"
            ) {
              handleTrackSubscribed(
                publication.track,
                publication,
                participant
              );
            }
          }
          participant.on(RoomEvent.TrackSubscribed, (track, publication) => {
            handleTrackSubscribed(track, publication, participant);
          });
        }

        // 새 참가자 처리
        newRoom.on(RoomEvent.ParticipantConnected, (participant) => {
          participant.on(RoomEvent.TrackSubscribed, (track, publication) => {
            handleTrackSubscribed(track, publication, participant);
          });
        });

        // 참가자 퇴장 처리
        newRoom.on(RoomEvent.ParticipantDisconnected, (participant) => {
          setRedTeam((prev) =>
            prev.filter((p) => p.identity !== participant.identity)
          );
          setBlueTeam((prev) =>
            prev.filter((p) => p.identity !== participant.identity)
          );
        });
      } catch (error) {
        console.error("LiveKit 연결 실패:", error);
      }
    };

    connectLiveKit();
  }, []);

  // 턴 변경 시 반대 팀 음소거 처리
  useEffect(() => {
    if (!roomRef.current) return;
    for (const participant of roomRef.current.remoteParticipants.values()) {
      const team = participant.metadata?.team;
      const shouldMute = turn === "RED" ? team === "BLUE" : team === "RED";
      participant.audioTracks.forEach((pub) => {
        if (pub.track) pub.track.enabled = !shouldMute;
      });
    }
  }, [turn]);

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
          </div>

          <div>
            <div className="text-center text-2xl">{`${turn} TEAM TURN`}</div>
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

          <RoundInfo round={1} redScore={0} blueScore={0} />
        </div>
      </section>

      {/* 3:3 화면 구성 */}
      <section className="basis-4/9 flex flex-row">
        {/* RED TEAM */}
        <div className="flex flex-wrap justify-center w-full bg-red-100 p-2">
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
        </div>
      </section>

      <section className="basis-3/9 flex flex-row">
        <div className="relative basis-1/3 ">
          <div className="absolute bottom-0 left-0 ">
            <ChatBox width="350px" height="250px" />
          </div>
        </div>

        {/* BLUE TEAM */}
        <div className="flex flex-wrap justify-center basis-2/3 bg-blue-100 p-2">
          <button
            onClick={handleCapture}
            className="w-40 h-20 bg-yellow-400 rounded hover:bg-yellow-500"
          >
            📸 사진 찰칵{" "}
          </button>
          {publisherTrack?.team === "BLUE" && (
            <LiveKitVideo
              videoTrack={publisherTrack.track}
              isLocal={true}
              nickname={publisherTrack.nickname}
              containerClassName="w-40 h-32 border border-blue-500 m-1"
            />
          )}
          {blueTeam.map((p) => (
            <LiveKitVideo
              key={p.identity}
              videoTrack={p.track}
              isLocal={false}
              nickname={p.nickname}
              containerClassName="w-40 h-32 border border-blue-500 m-1"
            />
          ))}
        </div>
      </section>
    </div>
  );
};

export default SamePosePage;
