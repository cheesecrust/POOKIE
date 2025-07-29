import background_sketchrelay from "../assets/background/background_sketchrelay.gif";
import RoundInfo from "../components/molecules/games/RoundInfo";
import ChatBox from "../components/molecules/common/ChatBox";
import LiveKitVideo from "../components/organisms/common/LiveKitVideo";
import { useEffect, useRef, useState } from "react";
import { connectSocket } from "../sockets/common/websocket";
import { emitGameStart, emitTurnChange, emitRoundOver } from "../sockets/games/sketchRelay/emit";
import { Room, RoomEvent, createLocalVideoTrack } from "livekit-client";

const OPENVIDU_SERVER_URL = "https://i13a604.p.ssafy.io/api";
const OPENVIDU_LIVEKIT_URL = "wss://i13a604.p.ssafy.io:443/";
const FASTAPI_URL = "http://localhost:8000/upload_images"; // FastAPI endpoint

const SketchRelayPage_VIDU = () => {
  const [roomName] = useState("9acd8513-8a8a-44aa-8cdd-3117d2c2fcb1");
  const [participantName] = useState(`dummyuser_${Math.floor(Math.random() * 10000)}`);
  const [redTeam, setRedTeam] = useState([]);
  const [blueTeam, setBlueTeam] = useState([]);
  const [publisherTrack, setPublisherTrack] = useState(null);
  const [firstUser, setFirstUser] = useState(null);

  const roomRef = useRef(null);

  // ✅ LiveKit 연결
  useEffect(() => {
    const connectLiveKit = async () => {
      try {
        const token = await getToken(roomName, participantName);
        const newRoom = new Room();
        await newRoom.connect(OPENVIDU_LIVEKIT_URL, token);
        console.log("✅ LiveKit 연결 성공");

        const videoTrack = await createLocalVideoTrack();
        await newRoom.localParticipant.publishTrack(videoTrack);
        setPublisherTrack({ track: videoTrack, identity: participantName });

        roomRef.current = newRoom;

        // ✅ 첫 번째 참가자 결정
        if (!firstUser) {
          setFirstUser(participantName);
        }

        const handleTrackSubscribed = (track, publication, participant) => {
          if (!participant || track.kind !== "video" || participant.isLocal) return;
          const team = "red"; // 필요 시 메타데이터로 결정
          const subscriberObj = { track, identity: participant.identity };
          const updateTeam = (setter) => {
            setter((prev) => {
              if (prev.find((p) => p.identity === participant.identity)) return prev;
              return [...prev, subscriberObj];
            });
          };
          if (team === "red") updateTeam(setRedTeam);
          else updateTeam(setBlueTeam);
        };

        // 기존 참가자 처리
        for (const participant of newRoom.remoteParticipants.values()) {
          for (const publication of participant.trackPublications.values()) {
            if (publication.isSubscribed && publication.track?.kind === "video") {
              handleTrackSubscribed(publication.track, publication, participant);
            }
          }
          participant.on(RoomEvent.TrackSubscribed, (track, publication) => {
            handleTrackSubscribed(track, publication, participant);
          });
        }

        // 새 참가자
        newRoom.on(RoomEvent.ParticipantConnected, (participant) => {
          participant.on(RoomEvent.TrackSubscribed, (track, publication) => {
            handleTrackSubscribed(track, publication, participant);
          });
        });

      } catch (error) {
        console.error("LiveKit 연결 실패:", error);
      }
    };

    connectLiveKit();

    return () => {
      if (roomRef.current) roomRef.current.disconnect();
    };
  }, [roomName, participantName]);

  // ✅ 캠 캡처 후 FastAPI 전송
  const handleCapture = async () => {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const formData = new FormData();

    const captureTrack = (videoTrack, identity) => {
        return new Promise((resolve) => {
            const videoEl = document.createElement("video");
            videoEl.srcObject = new MediaStream([videoTrack.mediaStreamTrack]);
            videoEl.muted = true;
            videoEl.playsInline = true;

            videoEl.onloadedmetadata = () => {
            videoEl.play().then(() => {
                canvas.width = videoEl.videoWidth;
                canvas.height = videoEl.videoHeight;
                ctx.drawImage(videoEl, 0, 0, canvas.width, canvas.height);

                canvas.toBlob((blob) => {
                const safeIdentity = identity.startsWith("dummyuser_") 
                    ? identity 
                    : `dummyuser_${identity}`;
                formData.append("images", blob, `${safeIdentity}.png`);
                resolve();
                }, "image/png");
            });
            };
        });
    };

    // ✅ 본인 + 모든 참가자
    if (publisherTrack) {
      await captureTrack(publisherTrack.track, publisherTrack.identity);
    }
    for (const user of [...redTeam, ...blueTeam]) {
      await captureTrack(user.track, user.identity);
    }

    // ✅ FastAPI로 전송
    try {
      const res = await fetch(FASTAPI_URL, {
        method: "POST",
        body: formData,
      });
      const result = await res.json();
      console.log("✅ FastAPI 응답:", result);
    } catch (err) {
      console.error("❌ FastAPI 전송 실패:", err);
    }
  };

  // JWT 토큰 요청
  async function getToken(roomName, participantName) {
    const token = import.meta.env.VITE_WS_TOKEN;
    const res = await fetch(`${OPENVIDU_SERVER_URL}/rtc/token`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ room: roomName, name: participantName, team: "red" }),
    });
    const tokenObj = await res.json();
    return tokenObj.token;
  }

  return (
    <div className="relative w-full h-screen overflow-hidden">
      <img src={background_sketchrelay} alt="background" className="absolute top-0 left-0 w-full h-full object-cover -z-10" />
      <div className="relative z-10 w-full h-full flex flex-col justify-between items-center py-12 px-10">

        {/* 캠 출력 */}
        <div className="flex gap-4 justify-center">
          {[...(publisherTrack ? [publisherTrack] : []), ...redTeam, ...blueTeam].map((sub, i) => (
            <LiveKitVideo key={i} videoTrack={sub.track} isLocal={sub.identity === participantName} />
          ))}
        </div>

        {/* 사진 찍기 버튼 (첫 참가자만 보임) */}
        {firstUser === participantName && (
          <button
            onClick={handleCapture}
            className="bg-yellow-400 px-4 py-2 rounded shadow-lg mt-4"
          >
            📸 사진 찰칵
          </button>
        )}

        {/* 칠판 */}
        <div className="w-[1200px] h-[600px] bg-white rounded-lg border-4 border-gray-300 shadow-inner my-6" />
      </div>

      <div className="absolute top-4 right-4 z-20">
        <RoundInfo round={1} redScore={0} blueScore={0} />
      </div>

      <div className="absolute bottom-4 left-0 z-20">
        <ChatBox width="300px" height="300px" />
      </div>

      <div className="absolute top-4 left-4 z-20 flex flex-col gap-2">
        <button onClick={emitGameStart} className="bg-green-300 px-4 py-2 rounded">GAME_START</button>
        <button onClick={emitTurnChange} className="bg-blue-300 px-4 py-2 rounded">TURN_CHANGE</button>
        <button onClick={emitRoundOver} className="bg-red-300 px-4 py-2 rounded">ROUND_OVER</button>
      </div>
    </div>
  );
};

export default SketchRelayPage_VIDU;