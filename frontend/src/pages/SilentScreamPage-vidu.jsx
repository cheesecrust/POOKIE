// src/pages/SilentScreamPage.jsx

import { useEffect, useState, useRef } from "react";
import { useParams } from "react-router-dom";
import LiveKitVideo from "../components/organisms/common/LiveKitVideo"
import { Room, RoomEvent, createLocalVideoTrack } from "livekit-client";
import backgroundSilentScream from "../assets/background/background_silentscream.gif"
import RoundInfo from "../components/molecules/games/RoundInfo";
import ChatBox from "../components/molecules/common/ChatBox";
import PopUpModal from "../components/atoms/modal/PopUpModal";
import KeywordModal from "../components/atoms/modal/KeywordModal";
import SubmitModal from "../components/molecules/games/SubmitModal";
import PassButton from "../components/atoms/button/PassButton.jsx"
import RightButton from "../components/atoms/button/RightButton.jsx"

import useAuthStore from "../store/useAuthStore.js";
import useGameStore from '../store/useGameStore'
import { emitGamePass, emitAnswerSubmit, emitTurnOver, emitRoundOver } from "../sockets/game/emit.js";

const SilentScreamPage_VIDU = () => {

  // livekit 선언
  const [redTeam, setRedTeam] = useState([]);
  const [blueTeam, setBlueTeam] = useState([]);
  const [firstUser, setFirstUser] = useState(null);
  const [publisherTrack, setPublisherTrack] = useState(null);
  const roomRef = useRef(null);

  const roomName = "silentscream_room";
  const participantName = `ss_user_${Math.floor(Math.random() * 10000)}`;
  const accessToken = useAuthStore.getState().accessToken;

  // auth 선언
  const {user} = useAuthStore();
  const myNickname = user?.nickname;
  const myIdx = user?.userAccountId;
  const roomId = useGameStore((state) => state.roomId);

  // 상태 관리 (전역)
  // 턴,라운드
  const turn = useGameStore((state) => state.turn);
  const round = useGameStore((state) => state.round);
  
  //타이머 
  const turnTimeLeft = useGameStore((state) => state.turnTimeLeft);
  const timeLeft = useGameStore((state) => state.timeLeft);

  // 맞히는 사람(제시어 x)
  const norIdxList = useGameStore((state) => state.norIdxList);
  
  // 발화자(제시어 가짐)
  const repIdx = useGameStore((state) => state.repIdx);
  const repIdxList = useGameStore((state) => state.repIdxList);

  //키워드 
  const keywordList = useGameStore((state) => state.keywordList);
  const keywordIdx = useGameStore((state) => state.keywordIdx);

  // 점수 관련
  const teamScore = useGameStore((state) => state.teamScore);
  const tempTeamScore = useGameStore((state) => state.tempTeamScore);
  const roundResult = useGameStore((state) => state.roundResult);
  const gameResult = useGameStore((state) => state.gameResult);

  // 상태 관리 (로컬)
  const [keyword, setKeyword] = useState("");
  const [score, setScore] = useState(0); // current turn 팀 점수

  // 모달 상태 관리
  const [isTurnModalOpen, setIsTurnModalOpen] = useState(false);
  const [isKeywordModalOpen, setIsKeywordModalOpen] = useState(false);
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);
  const [isGamestartModalOpen, setIsGamestartModalOpen] = useState(false);

  // 추가 상태
  const [isFirstLoad, setIsFirstLoad] = useState(true);

  const setRoomId = useGameStore((state) => state.setRoomId);

  // Livekit 연결
  useEffect(() => {
    const connectLiveKit = async () => {
      try {
        const livekitUrl = import.meta.env.VITE_OPENVIDU_LIVEKIT_URL;
        const token = await getToken(roomName, participantName);
        const newRoom = new Room();
        await newRoom.connect(livekitUrl, token, {
          metadata: JSON.stringify({
            nickname: myNickname,
            team: "red",
          }),
        });
        console.log("✅ LiveKit 연결 성공");

        const videoTrack = await createLocalVideoTrack();
        await newRoom.localParticipant.publishTrack(videoTrack);
        setPublisherTrack({ track: videoTrack, identity: participantName, nickname: myNickname });

        roomRef.current = newRoom;

        if (newRoom.remoteParticipants.size === 0 && myNickname) {
          setFirstUser((prev) => (prev !== myNickname ? myNickname : prev));
        } else {
          const [firstParticipant] = newRoom.remoteParticipants.values();
          const participantNickname = firstParticipant?.metadata?.nickname;
          if (participantNickname) {
            setFirstUser((prev) => (prev !== participantNickname ? participantNickname : prev));
          }
        }

        const handleTrackSubscribed = (track, publication, participant) => {
          if (!participant || track.kind !== "video" || participant.isLocal) return;

          // metadata 파싱
          let nickname = "unknown"
          let team = "red"
          try {
            const metadata = JSON.parse(participant.metadata);
            nickname = metadata.nickname || "unknown"
            team = metadata.team || "red"
          } catch (err) {
            console.warn("metadata 파싱 실패, participant.metadata:", participant.metadata)
          }

          const subscriberObj = {
            track,
            identity: participant.identity,
            nickname,
            team,
          };

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

  async function getToken(roomName, participantName) {
    if (!accessToken) throw new Error("로그인 필요. accessToken 없음");
    const apiUrl = import.meta.env.VITE_API_URL;
    const res = await fetch(`${apiUrl}/rtc/token`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ room: roomName, name: participantName, team: "red" }),
    });
    if (!res.ok) throw new Error("open vidu 토큰 요청 실패");
    const tokenObj = await res.json();
    return tokenObj.token;
  }

  // 1️ 첫 페이지 로딩
  useEffect(() => {
    setIsGamestartModalOpen(true);

    const timer1 = setTimeout(() => {
      setIsGamestartModalOpen(false);
      setIsTurnModalOpen(true);

      const timer2 = setTimeout(() => {
        setIsTurnModalOpen(false);
        setIsFirstLoad(false); // 첫 진입 끝남
      }, 3000);

      return () => clearTimeout(timer2);
    }, 3000);

    return () => clearTimeout(timer1);
  }, []);

    // repIdxList와 내 id가 매칭되고 keywordIdx가 변경되면 제시어 모달 띄우기
  useEffect(() => {
    if (repIdxList?.includes(myIdx) && keywordList.length > 0) {
      setKeyword(keywordList[keywordIdx] || "");
      setIsKeywordModalOpen(true);
    }
  }, [keywordIdx]);

  // 제시어 제출 모달 띄우기
  useEffect(() => {
    if (norIdxList?.includes(myIdx)) {
      setIsSubmitModalOpen(true);
    }
  }, []);

  // 턴 바뀔 때
  useEffect(() => {
    if (!isFirstLoad && !isGamestartModalOpen) {
      setIsTurnModalOpen(true);
      const timer = setTimeout(() => {
        setIsTurnModalOpen(false);
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [turn]);

  // esc 키 눌렀을 때 제출 모달 닫기
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        setIsSubmitModalOpen(false);
      }
    };
  
    if (isSubmitModalOpen) {
      window.addEventListener("keydown", handleKeyDown);
    }
  
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isSubmitModalOpen]);

  
  return (
    <div className="relative w-full h-screen overflow-hidden">
      {/* 배경 이미지는 absolute로 완전 뒤로 보내야 함 */}
      <img
        src={backgroundSilentScream}
        alt="background_silentScream"
        className="absolute top-0 left-0 w-full h-full object-cover -z-10"
      />

      {/*  모든 컨텐츠는 여기서 relative 위치로 올라감 */}
      <div className="relative z-10 w-full h-full flex flex-col items-center px-10">
        {/* 현재 팀 턴 */}
        <div className="text-center text-3xl font-bold">
          RED TEAM TURN
        </div>

        {/* 🔴 현재팀 캠 */}
        <div className="relative w-full h-[250px]">
          {/* user1 (Rep) - 왼쪽 크게 */}
          {publisherTrack && (
          <div className="absolute top-10 left-5">
            <LiveKitVideo
              key={publisherTrack.identity}
              videoTrack={publisherTrack.track}
              nickname={publisherTrack.identity}
              // isLocal={user.userAccountId === myIdx}
              isLocal={true}
              // isRef={true} // Ref 유저 고정
              containerClassName="w-180 h-125 rounded-lg shadow-lg"
              nicknameClassName="absolute bottom-4 left-4 text-white text-4xl"
            />
          </div>
          )}

          {/* user2 */}
          {publisherTrack && (
          <div className="absolute top-10 left-195">
            <LiveKitVideo
              key={publisherTrack.identity}
              videoTrack={publisherTrack.track}
              nickname={publisherTrack.identity}
              isLocal={true}
              // isLocal={publisherTrack.userAccountId === myIdx}
              containerClassName="w-90 h-60 rounded-lg shadow-lg"
              nicknameClassName="absolute bottom-4 left-4 text-white text-2xl"
            />
          </div>
            )}

          {/* user3 */}
          {publisherTrack && (
          <div className="absolute top-75 left-195">
            <LiveKitVideo
              key={publisherTrack.identity}
              videoTrack={publisherTrack.track}
              nickname={publisherTrack.identity}
              isLocal={true}
              // isLocal={publisherTrack.userAccountId === myIdx}
              containerClassName="w-90 h-60 rounded-lg shadow-lg"
              nicknameClassName="absolute bottom-4 left-4 text-white text-2xl"
            />
          </div>
          )}
        </div>

        {/* 상대팀 캠 */}
        <div className="relative w-full h-[180px] mt-auto">
          {/* 상대 팀 턴 라벨 */}
          <div className="absolute bottom-70 right-12 text-2xl font-bold">
            BLUE TEAM
          </div>

          {/* user4 */}
          {user && (
          <div className="absolute bottom-6 right-220">
            <LiveKitVideo
              key={user.identity}
              videoTrack={user.track}
              nickname={user.nickname}
              isLocal={user.userAccountId === myIdx}
              containerClassName="w-85 h-60 rounded-lg shadow-lg"
              nicknameClassName="absolute bottom-4 left-4 text-white text-2xl"
            />
          </div>
          )}

          {/* user5 */}
          {user && (
          <div className="absolute bottom-6 right-120">
            <LiveKitVideo
              key={user.identity}
              videoTrack={user.track}
              nickname={user.nickname}
              isLocal={user.userAccountId === myIdx}
              containerClassName="w-85 h-60 rounded-lg shadow-lg"
              nicknameClassName="absolute bottom-4 left-4 text-white text-2xl"
            />
          </div>
          )}

          {/* user6 */}
          {user && (
          <div className="absolute bottom-6 right-20">
            <LiveKitVideo
              key={user.identity}
              videoTrack={user.track}
              nickname={user.nickname}
              isLocal={user.userAccountId === myIdx}
              containerClassName="w-85 h-60 rounded-lg shadow-lg"
              nicknameClassName="absolute bottom-4 left-4 text-white text-2xl"
            />
          </div>
          )}
        </div>
          
        {/* RoundInfo (우측 상단 고정) */}
        <div className="absolute top-12 right-8 z-20 scale-150">
          <RoundInfo
            round={round}
            redScore={teamScore?.red ?? 0}
            blueScore={teamScore?.blue ?? 0}
          />
        </div>
        
        <div className="absolute top-80 right-40 z-20 flex flex-col items-center">
          {/* 발화자용 PASS 버튼 */}
          {repIdxList.includes(myIdx) && (
            <PassButton onClick={() => emitGamePass({ roomId })} />
          )}

          {/* 정답 제출 버튼 */}
          {norIdxList.includes(myIdx) && (
            console.log("✅ 제출 버튼 클릭됨"),
            <RightButton children="제출" onClick={() => setIsSubmitModalOpen(true)} />
          )}

          {/* 🔽 모든 유저에게 보이는 진행도 */}
          <div className="mt-2 px-3 py-1 bg-white border-2 border-black rounded shadow-md text-black text-lg font-bold text-center w-[100px]">
            {keywordIdx + 1} / 15
          </div>
        </div>
        

        {/* ChatBox (우측 하단 고정) */}
        <div className="absolute bottom-4 left-15 z-20 opacity-80">
          <ChatBox width="550px" height="400px" />
        </div>

      </div>

       {/* GAME START 모달 */}
      <PopUpModal 
        isOpen={isGamestartModalOpen} 
        onClose={() => setIsGamestartModalOpen(false)}
      >
        <p className="text-6xl font-bold font-pixel">GAME START</p>
      </PopUpModal>
      
      {/* 제시어 제출 모달 */}
      {isSubmitModalOpen && (
      <SubmitModal 
        isOpen={isSubmitModalOpen}
        onClose={() => setIsSubmitModalOpen(false)}
        onSubmit={(inputAnswer) => {
          emitAnswerSubmit({roomId, round, norId:myIdx, keywordIdx, inputAnswer});
          setIsSubmitModalOpen(false);
        }}
      />
    )}

      {/*  KEYWORD 모달 */}
      <KeywordModal 
        isOpen={isKeywordModalOpen} 
        onClose={() => setIsKeywordModalOpen(false)}
        children={keyword}
      >
      </KeywordModal>

      {/* 턴 모달 */}
      <PopUpModal 
        isOpen={isTurnModalOpen} 
        onClose={() => setIsTurnModalOpen(false)}
      >
        <p className="text-6xl font-bold font-pixel">{turn === "RED" ? "RED TEAM TURN" : "BLUE TEAM TURN"}</p>
      </PopUpModal>
    </div>

  );
}

export default SilentScreamPage_VIDU;