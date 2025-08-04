import backgroundSilentScream from "../assets/background/background_silentscream.gif";
import RoundInfo from "../components/molecules/games/RoundInfo";
import ChatBox from "../components/molecules/common/ChatBox";
import { useEffect, useRef, useState } from "react";
import { Room, RoomEvent, createLocalVideoTrack } from "livekit-client";
import useAuthStore from "../store/useAuthStore";

const SilentScreamPage_VIDU = () => {
  const [roomName] = useState("silentscream");
  const [participantName] = useState(`ss_user_${Math.floor(Math.random() * 10000)}`);
  const roomRef = useRef(null);

  const userRefs = {
    user1: useRef(null),
    user2: useRef(null),
    user3: useRef(null),
    user4: useRef(null),
    user5: useRef(null),
    user6: useRef(null),
  };

  const user = useAuthStore((state) => state.user);
  const accessToken = useAuthStore((state) => state.accessToken);
  const myNickname = user?.nickname;

  useEffect(() => {
    const connectLiveKit = async () => {
      try {
        const livekitUrl = import.meta.env.VITE_OPENVIDU_LIVEKIT_URL;
        const token = await getToken(roomName, participantName);
        const newRoom = new Room();
        await newRoom.connect(livekitUrl, token);
        console.log("✅ LiveKit 연결 성공");

        const videoTrack = await createLocalVideoTrack();
        await newRoom.localParticipant.publishTrack(videoTrack);

        if (userRefs.user1.current && videoTrack) {
          const videoElement = videoTrack.attach();
          videoElement.style.width = "100%";
          videoElement.style.height = "100%";
          videoElement.style.objectFit = "cover";
          userRefs.user1.current.innerHTML = "";
          userRefs.user1.current.appendChild(videoElement);
        }

        roomRef.current = newRoom;

        newRoom.on(RoomEvent.ParticipantDisconnected, (participant) => {
          console.log("🔌 참가자 퇴장:", participant.identity);
        });
      } catch (err) {
        console.error("LiveKit 연결 실패:", err);
      }
    };

    connectLiveKit();

    return () => {
      if (roomRef.current) roomRef.current.disconnect();
    };
  }, []);

  async function getToken(roomName, participantName) {
    if (!accessToken) throw new Error("로그인이 필요합니다. accessToken 없음");
    const apiUrl = import.meta.env.VITE_API_URL;

    const res = await fetch(`${apiUrl}/rtc/token`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ room: roomName, name: participantName, team: "red" }),
    });

    if (!res.ok) throw new Error("LiveKit 토큰 요청 실패");
    const tokenObj = await res.json();
    return tokenObj.token;
  }

  return (
    <div className="relative w-full h-screen overflow-hidden">
      <img
        src={backgroundSilentScream}
        alt="background_silentScream"
        className="absolute top-0 left-0 w-full h-full object-cover -z-10"
      />

      <div className="relative z-10 w-full h-full flex flex-col items-center py-12 px-10">
        <div className="text-center text-3xl font-bold">RED TEAM TURN</div>

        <div className="relative w-full h-[350px]">
          <div
            ref={userRefs.user1}
            className="absolute top-10 left-5 w-[720px] h-[500px] bg-black rounded-xl overflow-hidden"
          />
          <div
            ref={userRefs.user2}
            className="absolute top-10 left-[750px] w-[360px] h-[240px] bg-black rounded-xl overflow-hidden"
          />
          <div
            ref={userRefs.user3}
            className="absolute top-[270px] left-[750px] w-[360px] h-[240px] bg-black rounded-xl overflow-hidden"
          />
        </div>

        <div className="relative w-full h-[180px] mt-auto">
          <div className="absolute bottom-[260px] right-12 text-3xl font-bold">BLUE TEAM</div>
          <div
            ref={userRefs.user4}
            className="absolute bottom-0 right-[540px] w-[300px] h-[240px] bg-black rounded-xl overflow-hidden"
          />
          <div
            ref={userRefs.user5}
            className="absolute bottom-0 right-[270px] w-[300px] h-[240px] bg-black rounded-xl overflow-hidden"
          />
          <div
            ref={userRefs.user6}
            className="absolute bottom-0 right-0 w-[300px] h-[240px] bg-black rounded-xl overflow-hidden"
          />
        </div>

        <div className="absolute top-6 right-8 z-20">
          <RoundInfo round={1} redScore={0} blueScore={0} />
        </div>

        <div className="absolute bottom-4 left-16 z-20 opacity-80">
          <ChatBox width="550px" height="400px" />
        </div>
      </div>
    </div>
  );
};

export default SilentScreamPage_VIDU;