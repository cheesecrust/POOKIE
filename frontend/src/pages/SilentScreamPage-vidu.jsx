// src/pages/SilentScreamPage-vidu.jsx

import { useEffect, useRef, useState } from "react";
import backgroundSilentScream from "../assets/background/background_silentscream.gif"
import RoundInfo from "../components/molecules/games/RoundInfo";
import ChatBox from "../components/molecules/common/ChatBox";
import LiveKitVideo from "../components/organisms/common/LiveKitVideo";
import { Room, RoomEvent, createLocalVideoTrack, createLocalAudioTrack } from "livekit-client";
import useAuthStore from "../store/useAuthStore"

const SilentScreamPage_VIDU = () => {
  // 상태 관리 
  const [roomName] = useState("silentscream_roomId")
  const [participantName] = useState(`ss_user_${Math.floor(Math.random() * 10000)}`);
  const [publisherTrack, setPublisherTrack] = useState(null);
  const roomRef = useRef(null);
  const [redTeam, setRedTeam] = useState([]);
  const [blueTeam, setBlueTeam] = useState([]);
  const [firstUser, setFirstUser] = useState(null);

  const [turnTeam, setTurnTeam] = useState("red");
  const [round,setRound] = useState(1);
  const [turnTimeLeft, setTurnTimeLeft] = useState(30);
  const [timeLeft, setTimeLeft] = useState(5);
  const [norIdxList,setNorIdxList] = useState([]);
  const [repIdxList,setRepIdxList] = useState([]);
  const [repIdx,setRepIdx] = useState(0);
  const [keywords, setKeywords] = useState([]);
  const [currentKeywordIdx,setCurrentKeywordIdx] = useState(null);
  const [scores, setScores] = useState({ red: 0, blue: 0 });
  
  const user = useAuthStore((state) => state.user);
  const accessToken = useAuthStore((state) => state.accessToken);
  const myNickname = user?.nickname;

  useEffect(() => {
    console.log('로그인 상태 확인')
    // console.log('isLoggedIn', isLoggedIn)
    // console.log('user', user)
    // console.log('accessToken', accessToken)
  }, []);

  //  LiveKit 연결
  useEffect(() => {
    const connectLiveKit = async () => {
        try {
            const livekitUrl = import.meta.env.VITE_OPENVIDU_LIVEKIT_URL;
            const token = await getToken(roomName, participantName);
            const newRoom = new Room();
            await newRoom.connect(livekitUrl, token);
            console.log("✅ LiveKit 연결 성공");

            // 캠 시작
            const videoTrack = await createLocalVideoTrack();
            await newRoom.localParticipant.publishTrack(videoTrack);
            setPublisherTrack({
                track: videoTrack,
                identity: participantName,
                nickname: myNickname,
            });

            roomRef.current = newRoom;

            // ✅ firstUser 지정 (닉네임이 유효할 때만)
            if (newRoom.remoteParticipants.size === 0 && myNickname) {
              setFirstUser((prev) => (prev !== myNickname ? myNickname : prev));
            } else {
              const [firstParticipant] = newRoom.remoteParticipants.values();
              const participantNickname = firstParticipant?.metadata?.nickname;
              if (participantNickname) {
                setFirstUser((prev) =>
                  prev !== participantNickname ? participantNickname : prev
                );
              }
            }

            const handleTrackSubscribed = (track, publication, participant) => {
              if (!participant || track.kind !== "video" || participant.isLocal) return;
              const nickname = participant.metadata?.nickname || "unknown";
              const subscriberObj = {
                track,
                identity: participant.identity,
                nickname,
              };
              const updateTeam = (setter) => {
                setter((prev) => {
                  if (prev.find((p) => p.identity === participant.identity)) return prev;
                  return [...prev, subscriberObj];
                });
              };
              const team = participant.metadata?.team || "red";
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

            // 참가자 퇴장 시 처리
            newRoom.on(RoomEvent.ParticipantDisconnected, (participant) => {
              setRedTeam((prev) => prev.filter((p) => p.identity !== participant.identity));
              setBlueTeam((prev) => prev.filter((p) => p.identity !== participant.identity));
            });
          } catch (error) {
            console.error("LiveKit 연결 실패:", error);
          }
        };

        connectLiveKit();

        return () => {
          if (roomRef.current) roomRef.current.disconnect();
        };
      }, []);

      // LiveKit 토큰 요청
      async function getToken(roomName, participantName) {
        if (!accessToken) {
            throw new Error("로그인 필요. accessToken 없음")
        }

        const apiUrl = import.meta.env.VITE_API_URL;
        const res = await fetch(`${apiUrl}/rtc/token`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ room: roomName, name: participantName, team: "red" }),
        });

        if (!res.ok) {
          throw new Error("open vidu 토큰 요청 실패");
        }

        const tokenObj = await res.json();
        return tokenObj.token;
      }

  return (
    <div className="relative w-full h-screen overflow-hidden">
      {/* 배경 이미지는 absolute로 완전 뒤로 보내야 함 */}
      <img
        src={backgroundSilentScream}
        alt="background_silentScream"
        className="absolute top-0 left-0 w-full h-full object-cover -z-10"
      />

      {/*  모든 컨텐츠는 여기서 relative 위치로 올라감 */}
      <div className="relative z-10 w-full h-full flex flex-col items-center py-12 px-10">
        {/* 현재 팀 턴 */}
        <div className="text-center text-3xl font-bold">
          RED TEAM TURN
        </div>

        {/* 🔴 현재팀 캠 */}
        <div className="relative w-full h-[350px]">
          {/* user1 - 왼쪽 크게 */}
          <div className="absolute top-10 left-5 w-180 h-125 bg-white rounded-lg shadow-lg">
            <p className="text-start text-4xl px-5 py-110">
             user1
            </p>
          </div>

          {/* user2 */}
          <div className="absolute top-10 left-195 w-90 h-60 bg-white rounded-lg shadow-lg">
            <p className="text-start text-2xl px-5 py-50">
              user2
            </p>
          </div>

          {/* user3 */}
          <div className="absolute top-75 left-195 w-90 h-60 bg-white rounded-lg shadow-lg">
            <p className="text-start text-2xl px-5 py-50">
              user3
            </p>
          </div>

        </div>


        {/* 상대팀 캠 */}
        <div className="relative w-full h-[180px] mt-auto">
          {/* 상대 팀 턴 */}
          <div className="absolute bottom-65 right-12 text-3xl font-bold">
            BLUE TEAM
          </div>
          {/* user4 */}
          <div className="absolute bottom-0 right-170 w-75 h-60 bg-white rounded-lg shadow-lg">
            <p className="text-start text-2xl px-5 py-50">
              user4
            </p>
          </div>

          {/* user5 */}
          <div className="absolute bottom-0 right-90 w-75 h-60 bg-white rounded-lg shadow-lg">
            <p className="text-start text-2xl px-5 py-50">
              user5
            </p>
          </div>

          {/* user6 */}
          <div className="absolute bottom-0 right-10 w-75 h-60 bg-white rounded-lg shadow-lg">
            <p className="text-start text-2xl px-5 py-50">
              user6
            </p>
          </div>

        </div>

        {/* RoundInfo (우측 상단 고정) */}
        <div className="absolute top-6 right-8 z-20">
          <RoundInfo round={1} redScore={0} blueScore={0} />
        </div>

        {/* ChatBox (우측 하단 고정) */}
        <div className="absolute bottom-4 left-15 z-20 opacity-80">
          <div className="relative w-[550px] h-[400px] "> 
            <div className="absolute bottom-5 left-0 ">  
              <ChatBox width="550px" height="400px" />          
            </div>
          </div>
        </div>

      </div>
    </div>

  );
}

export default SilentScreamPage_VIDU;

