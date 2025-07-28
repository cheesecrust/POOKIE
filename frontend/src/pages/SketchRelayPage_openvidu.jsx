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

const SketchRelayPage_VIDU = () => {
  const [roomName] = useState("9acd8513-8a8a-44aa-8cdd-3117d2c2fcb1");
  const [participantName] = useState(`dummyuser_${Math.floor(Math.random() * 10000)}`);
  const [redTeam, setRedTeam] = useState([]);
  const [blueTeam, setBlueTeam] = useState([]);
  const [publisherTrack, setPublisherTrack] = useState(null);

  const roomRef = useRef(null);

  // ✅ WebSocket 연결
  useEffect(() => {
    const token = import.meta.env.VITE_WS_TOKEN;
    connectSocket({
      url: "wss://i13a604.p.ssafy.io/api/game",
      token,
      onMessage: (data) => {
        try {
          console.log("[WebSocket MESSAGE]", data);
          if (data.type === "ON") {
            console.log("유저 연결됨:", data.user.userNickname);
          }
        } catch (err) {
          console.error("[WebSocket MESSAGE PARSE ERROR]", err);
        }
      },
      onOpen: (e) => console.log("[WebSocket OPEN]", e),
      onClose: (e) => console.log("[WebSocket CLOSE]", e),
      onError: (e) => console.log("[WebSocket ERROR]", e),
    });
  }, []);

  // ✅ LiveKit 연결
  useEffect(() => {
    const connectLiveKit = async () => {
      try {
        const token = await getToken(roomName, participantName);
        const newRoom = new Room();
        console.log("👉 연결할 토큰:", token);

        await newRoom.connect(OPENVIDU_LIVEKIT_URL, token);
        console.log("✅ LiveKit 연결 성공");

        const videoTrack = await createLocalVideoTrack();
        await newRoom.localParticipant.publishTrack(videoTrack);
        setPublisherTrack({ track: videoTrack, identity: participantName });

        roomRef.current = newRoom;

        const handleTrackSubscribed = (track, publication, participant) => {
          if (!participant || track.kind !== "video" || participant.isLocal) return;

          let team = getTeamFromMetadata(participant.metadata);
          console.log("👤 트랙 등록됨:", participant.identity, "팀:", team);

          const subscriberObj = { track, identity: participant.identity };
          const updateTeam = (setter) => {
            setter((prev) => {
              if (prev.find((p) => p.identity === participant.identity)) return prev;
              return prev.length < 3 ? [...prev, subscriberObj] : prev;
            });
          };

          if (team === "red") updateTeam(setRedTeam);
          else if (team === "blue") updateTeam(setBlueTeam);
        };

        // 기존 참가자 트랙 처리
        Array.from(newRoom.remoteParticipants.values()).forEach((participant) => {
            console.log("🎯 기존 참가자:", participant.identity);

            // ✅ 안전하게 trackPublication 순회
            for (const publication of participant.trackPublications.values()) {
                if (publication.isSubscribed && publication.track?.kind === "video") {
                console.log("⚡ 기존 참가자 트랙 수동 등록:", participant.identity);
                handleTrackSubscribed(publication.track, publication, participant);
                }
            }

            participant.on(RoomEvent.TrackSubscribed, (track, publication) => {
                console.log("🎥 트랙 구독됨:", track.kind, participant.identity);
                handleTrackSubscribed(track, publication, participant);
            });
        });

        // 새 참가자 연결 시
        newRoom.on(RoomEvent.ParticipantConnected, (participant) => {
          console.log("🎯 새로운 참가자 연결됨:", participant.identity);
          participant.on(RoomEvent.TrackSubscribed, (track, publication) => {
            console.log("🎥 트랙 구독됨:", track.kind, participant.identity);
            handleTrackSubscribed(track, publication, participant);
          });
        });

        // 퇴장 및 트랙 제거
        const removeParticipant = (participant) => {
          setRedTeam((prev) => prev.filter((p) => p.identity !== participant.identity));
          setBlueTeam((prev) => prev.filter((p) => p.identity !== participant.identity));
        };

        newRoom.on(RoomEvent.ParticipantDisconnected, removeParticipant);
        newRoom.on(RoomEvent.TrackUnsubscribed, (_, __, participant) => removeParticipant(participant));
        newRoom.on(RoomEvent.Disconnected, () => console.log("❌ LiveKit 연결 종료됨"));

      } catch (error) {
        console.error("LiveKit 연결 실패:", error);
      }
    };

    connectLiveKit();

    return () => {
      if (roomRef.current) {
        roomRef.current.disconnect();
        console.log("🔌 LiveKit 연결 해제됨");
      }
    };
  }, [roomName, participantName]);

  // 메타데이터에서 팀 추출
  const getTeamFromMetadata = (metadata) => {
    try {
      return JSON.parse(metadata)?.team || "unknown";
    } catch {
      return "unknown";
    }
  };

  // JWT 토큰 요청
  async function getToken(roomName, participantName) {
    const token = import.meta.env.VITE_WS_TOKEN;
    try {
      const res = await fetch(`${OPENVIDU_SERVER_URL}/rtc/token`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ room: roomName, name: participantName, team: "red" }),
      });

      const tokenObj = await res.json();
      return tokenObj.token;
    } catch (err) {
      console.error("getToken error:", err);
      throw err;
    }
  }

  // 디버깅용
  useEffect(() => console.log("🟥 redTeam:", redTeam), [redTeam]);
  useEffect(() => console.log("🟦 blueTeam:", blueTeam), [blueTeam]);

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

        {/* 칠판 */}
        <div className="w-[1200px] h-[600px] bg-white rounded-lg border-4 border-gray-300 shadow-inner my-6" />

        {/* 하단 캠 (미사용 시 주석) */}
        {/* {publisherTrack && <LiveKitVideo videoTrack={publisherTrack.track} isLocal={true} />} */}
      </div>

      <div className="absolute top-4 right-4 z-20">
        <RoundInfo round={1} redScore={0} blueScore={0} />
      </div>

      <div className="absolute bottom-4 left-0 z-20">
        <div className="relative w-[300px] h-[300px]">
          <div className="absolute bottom-0 left-0">
            <ChatBox width="300px" height="300px" />
          </div>
        </div>
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