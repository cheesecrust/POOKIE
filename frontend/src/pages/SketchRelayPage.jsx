// src/pages/SketchRelayPage.jsx
import background_sketchrelay from "../assets/background/background_sketchrelay.gif";
import RoundInfo from "../components/molecules/games/RoundInfo";
import ChatBox from "../components/molecules/common/ChatBox";
import LiveKitVideo from "../components/organisms/common/LiveKitVideo"; 
import { useEffect, useRef, useState } from "react";
import { connectSocket } from "../sockets/common/websocket";
import {
  emitGameStart,
  emitTurnChange,
  emitRoundOver,
} from "../sockets/games/sketchRelay/emit";

import {
    // LocalVideoTrack,
    // RemoteParticipant,
    // RemoteTrack,
    // RemoteTrackPublication,
    Room,
    RoomEvent
} from "livekit-client";

// OpenVidu 설정
const OPENVIDU_SERVER_URL = "https://i13a604.p.ssafy.io/api";
const OPENVIDU_LIVEKIT_URL = "wss://i13a604.p.ssafy.io:443/";

const SketchRelayPage = () => {
  const [room, setRoom] = useState(undefined);
  const [roomName, setRoomName] = useState("그림 그리기");
  const [session, setSession] = useState(null);
  const [publisherTrack, setPublisherTrack] = useState(null);
  const [subscribers, setSubscribers] = useState([]);
  const roomRef = useRef(null);
  const [participantName] = useState("test");

  useEffect(() => {
    const token = import.meta.env.VITE_WS_TOKEN;

    connectSocket({ // 정확한 워딩은 serverSocket, 왜냐면 이 page 자체에서 2개의 socket 연결이 일어나기 때문
      url: "wss://i13a604.p.ssafy.io/api/game",
      token: token,
      onMessage: (e) => {
        try {
          // 그대로 출력
          console.log("[WebSocket MESSAGE]", e);

          // e 가 바로 객체로 전달돼서 parsing 할 필요가 없음음
          const data = e;

          console.log("[WebSocket DATA]", data);

          // 예시: 메시지 타입 분기
          if (e.type === "ON") {
            console.log("유저 연결됨:", data.user.userNickname);
          }
        } catch (err) {
          console.error("[WebSocket MESSAGE PARSE ERROR]", err);
        }
      },

      onOpen: (e) => {
        console.log("[WebSocket OPEN]", e);
      },
      onClose: (e) => {
        console.log("[WebSocket CLOSE]", e);
      },
      onError: (e) => {
        console.log("[WebSocket ERROR]", e);
      },
    });
  }, []);

  // OpenVidu3 연결 => livekit 으로 연결  
  useEffect(() => {
    const connectLiveKit = async () => {
      try {
        const token = await getToken(roomName, participantName);
        const newRoom = new Room();
        console.log("👉 연결할 토큰:", token);
        await newRoom.connect(OPENVIDU_LIVEKIT_URL, token);
        console.log("✅ LiveKit 연결 성공");
        await newRoom.localParticipant.enableCameraAndMicrophone();
        roomRef.current = newRoom;

        const videoPubIter = newRoom.localParticipant.videoTrackPublications.values();
        console.log("📸 로컬 비디오 트랙:", videoPubIter);
        const firstVideoPub = videoPubIter.next().value;
        if (firstVideoPub) {
          const videoTrack = firstVideoPub.track;
          setPublisherTrack(videoTrack); // ✅ 실제 VideoTrack 인스턴스를 넘김
        }

        newRoom.on(RoomEvent.TrackSubscribed, (track, publication, participant) => {
          if (track.kind === "video") {
            const videoEl = document.createElement("video");
            videoEl.autoplay = true;
            videoEl.playsInline = true;
            videoEl.muted = participant.isLocal;
            track.attach(videoEl);
            document.getElementById("video-container").appendChild(videoEl);
          }
        });


        newRoom.on(RoomEvent.Disconnected, () => {
          console.log("❌ LiveKit 연결 종료됨");
        });

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

  async function getToken(roomName, participantName) {
    const token = import.meta.env.VITE_WS_TOKEN;
    try {
      // 1. LiveKit 서버에 JWT 토큰 요청 (OpenVidu 서버 API처럼 구현되어 있음)
      const res = await fetch(OPENVIDU_SERVER_URL + "/rtc/token", {
        method: "POST",
        headers: {
          Authorization: "Bearer " + token,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          room: roomName,
          name: participantName,
          team: "red"
        })
      });

      if (!res.ok) {
        const errorText = await res.text();
        console.error("❌ Error in /rtc/token:", res.status, errorText);
        throw new Error("Failed to get token from /rtc/token");
      }
      // console.log("✅ 받은 응답 전체:", tokenforOpenvidu);
      const tokenforOpenvidu = await res.json();
      console.log("✅ 받은 JWT 토큰:", tokenforOpenvidu.token);

      // ✅ 토큰 문자열만 반환
      return tokenforOpenvidu.token;
    } catch (err) {
      console.error("getToken error:", err);
      throw err;
    }
  }


  return (
    <div className="relative w-full h-screen overflow-hidden">
      {/* 배경 이미지는 absolute로 완전 뒤로 보내야 함 */}
      <img
        src={background_sketchrelay}
        alt="background_sketchrelay"
        className="absolute top-0 left-0 w-full h-full object-cover -z-10"
      />

      {/*  모든 컨텐츠는 여기서 relative 위치로 올라감 */}
      <div className="relative z-10 w-full h-full flex flex-col justify-between items-center py-12 px-10">
        {/* 나혼자  */}
        <div className="flex gap-4 justify-center">
          {publisherTrack && (
            <LiveKitVideo videoTrack={publisherTrack} isLocal={true} />
          )}
        </div>

        {/*  레드팀 캠 */}
        {/* <div className="flex gap-19 justify-center">
          {[publisher, ...subscribers].map((streamManager, i) => (
            <div
              key={i}
              className="w-50 h-32 bg-white rounded-lg shadow-lg overflow-hidden"
              id={`video-box-${i}`}
            >
              <div
                id={`video-container-${i}`}
                className="w-full h-full"
              ></div>
              {streamManager &&
                streamManager.addVideoElement(
                  document.getElementById(`video-container-${i}`)
                )}
            </div>
          ))}
        </div> */}

        {/*  칠판 자리 canvas Api */}
        <div className="w-[1200px] h-[600px] bg-white rounded-lg border-4 border-gray-300 shadow-inner my-6" />

        {/* 블루팀 캠 */}
        <div className="flex gap-19 justify-center">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="w-50 h-32 bg-white rounded-lg shadow-lg" />
          ))}
        </div>
      </div>

      {/* RoundInfo (우측 상단 고정) */}
      <div className="absolute top-4 right-4 z-20">
        <RoundInfo round={1} redScore={0} blueScore={0} />
      </div>

      {/* ChatBox (우측 하단 고정) */}
      <div className="absolute bottom-4 left-0 z-20">
        <div className="relative w-[300px] h-[300px] ">
          <div className="absolute bottom-0 left-0 ">
            <ChatBox width="300px" height="300px" />
          </div>
        </div>
      </div>

      {/* 테스트용 emit 버튼 */}
      <div className="absolute top-4 left-4 z-20 flex flex-col gap-2">
        {/* <button onClick={emitConnect} className="bg-gray-300 px-4 py-2 rounded">CONNECT</button> */}
        <button
          onClick={emitGameStart}
          className="bg-green-300 px-4 py-2 rounded"
        >
          GAME_START
        </button>
        <button
          onClick={emitTurnChange}
          className="bg-blue-300 px-4 py-2 rounded"
        >
          TURN_CHANGE
        </button>
        <button
          onClick={emitRoundOver}
          className="bg-red-300 px-4 py-2 rounded"
        >
          ROUND_OVER
        </button>
      </div>
    </div>
  );
};

export default SketchRelayPage;