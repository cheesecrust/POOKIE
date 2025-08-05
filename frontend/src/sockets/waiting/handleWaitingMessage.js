// src/sockets/waiting/handleWaitingMessage.js
import useGameStore from "../../store/useGameStore";
import { Room, createLocalVideoTrack } from "livekit-client";


const handleWaitingMessage = (data, handlers = {}) => {
    const {
        user = {},
        room = {},
        setRoom = () => { },
        setTeam = () => { },
        setIsReady = () => { },
        navigate = () => { },
    } = handlers;

    if (!data?.type) return;

    const {
        setRoom: setGlobalRoom,
        setRtcToken,
        setTurn,
        setRound,
        setRed,
        setBlue,
        setMaster,
    } = useGameStore.getState();

    const updateClientState = (room) => {
        setRoom(room);

        const myTeam = room.RED.some((u) => u.id === user.id)
            ? "RED"
            : room.BLUE.some((u) => u.id === user.id)
                ? "BLUE"
                : null;

        setTeam(myTeam);

        const me = room[myTeam]?.find((u) => u.id === user.id);
        setIsReady(me?.status === "READY");
    };

    switch (data.type) {

        // // 방 참여
        case "WAITING_JOINED":
            console.log("🟢 새 사용자 입장:", data.user?.nickname, "| 방 상태 업데이트");
            updateClientState(data.room);
            break;

        // 팀 변경
        case "WAITING_TEAM_CHANGED":

        // 준비 변경
        case "WAITING_READY_CHANGED":

        // 게임 타입 변경
        case "WAITING_GAMETYPE_CHANGED":
            updateClientState(data.room);
            break;

        case "WAITING_USER_LEAVED": {
            navigate("/home", { state: { kicked: data.reason === "KICKED" } });
            break;
        }

        case "WAITING_USER_REMOVED": {
            // 본인이 아닌 유저 강퇴됨 → 그냥 방 상태 갱신만
            updateClientState(data.room);
            break;
        }

        case "GAME_STARTED": {
            const { rtc_token, turn, round } = data;
            console.log("🟢 게임 시작 메시지 수신:", data);
            // 전역으로 넣어달라 하십니다
            setRtcToken(rtc_token);
            setTurn(turn);
            setRound(round);
            setRed(room.RED);
            setBlue(room.BLUE);
            setMaster(room.master.id)
            
            console.log(room)
            console.log(room.master)
            console.log(room.RED)
            console.log(room.BLUE)

            // LiveKit 연결 추가
            const connectLiveKit = async () => {
                try {
                  const livekitUrl = import.meta.env.VITE_OPENVIDU_LIVEKIT_URL;
                  const roomInstance = new Room();
              
                  const myTeam = room.RED.some((u) => u.id === user.id) ? "RED" : "BLUE";
                  const myNickname = user.nickname || `user_${user.id}`;
              
                  await roomInstance.connect(livekitUrl, rtc_token, {
                    metadata: JSON.stringify({
                      nickname: myNickname,
                      team: myTeam.toLowerCase(),
                    }),
                  });
              
                  const videoTrack = await createLocalVideoTrack();
                  await roomInstance.localParticipant.publishTrack(videoTrack);
              
                  // 내 정보 participants 추가, 나머지는 TrackSubscribed에서 들어오면 추가가
                  const initialParticipants = [{
                    identity: roomInstance.localParticipant.identity,
                    track: videoTrack,
                    userAccountId: user.id,
                    nickname: myNickname,
                    team: myTeam.toLowerCase(),
                    isLocal: true,
                  }];
                  useGameStore.getState().setParticipants(initialParticipants);
              
                  // 새 참가자 들어오면 participants에 추가
                  roomInstance.on(RoomEvent.ParticipantConnected, (participant) => {
                    const metadata = JSON.parse(participant.metadata || '{}');
                    const nickname = metadata.nickname || 'anonymous';
                    const team = metadata.team || null;
              
                    const newParticipant = {
                      identity: participant.identity,
                      track: null, // 아직 트랙은 없음
                      nickname,
                      team,
                      isLocal: false,
                    };
              
                    const prev = useGameStore.getState().participants;
                    useGameStore.getState().setParticipants([...prev, newParticipant]);
                  });
              
                  // 참가자 트랙 연결되면 track 할당
                  roomInstance.on(RoomEvent.TrackSubscribed, (track, publication, participant) => {
                    const { setParticipants, participants } = useGameStore.getState();
              
                    setParticipants(
                      participants.map((p) =>
                        p.identity === participant.identity ? { ...p, track } : p
                      )
                    );
                  });
              
                  // roomInstance 저장
                  useGameStore.getState().setRoomInstance(roomInstance);
              
                  console.log("✅ LiveKit 연결 및 participants 저장 완료");
                } catch (err) {
                  console.error("❌ LiveKit 연결 실패:", err);
                  alert("LiveKit 연결 실패");
                }
              };
            

            connectLiveKit();

            navigate(`/${room.gameType.toLowerCase()}/${room.id}`);
            break;
        }


        case "ERROR":
            console.error("❌ 서버 오류:", data.msg);
            alert(data.msg);
            break;

        default:
            console.warn("⚠️ 처리되지 않은 메시지 타입:", data);
    }
};

export default handleWaitingMessage;
