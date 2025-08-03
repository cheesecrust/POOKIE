// import background_sketchrelay from "../assets/background/background_sketchrelay.gif";
// import RoundInfo from "../components/molecules/games/RoundInfo";
// import ChatBox from "../components/molecules/common/ChatBox";
// import LiveKitVideo from "../components/organisms/common/LiveKitVideo";
// import { useEffect, useRef, useState } from "react";
// import { emitGameStart, emitTurnChange, emitRoundOver } from "../sockets/games/sketchRelay/emit";
// import { Room, RoomEvent, createLocalVideoTrack } from "livekit-client";
// import useAuthStore from "../store/store";
// import { shallow } from "zustand/shallow";

// const SketchRelayPage_VIDU = () => {
//   const [roomName] = useState("9acd8513-8a8a-44aa-8cdd-3117d2c2fcb1");
//   const [participantName] = useState(`dummyuser_${Math.floor(Math.random() * 10000)}`);
//   const [redTeam, setRedTeam] = useState([]);
//   const [blueTeam, setBlueTeam] = useState([]);
//   const [publisherTrack, setPublisherTrack] = useState(null);
//   const [firstUser, setFirstUser] = useState(null);

//   const roomRef = useRef(null);

//   const user = useAuthStore((state) => state.user);
//   const accessToken = useAuthStore((state) => state.accessToken);
//   const myNickname = user?.nickname;

//   // ✅ LiveKit 연결
//   useEffect(() => {
//     const connectLiveKit = async () => {
//       try {
//         const livekitUrl = import.meta.env.VITE_OPENVIDU_LIVEKIT_URL;
//         const token = await getToken(roomName, participantName);
//         const newRoom = new Room();
//         await newRoom.connect(livekitUrl, token);
//         console.log("✅ LiveKit 연결 성공");

//         // 캠 시작
//         const videoTrack = await createLocalVideoTrack();
//         await newRoom.localParticipant.publishTrack(videoTrack);
//         setPublisherTrack({
//           track: videoTrack,
//           identity: participantName,
//           nickname: myNickname,
//         });

//         roomRef.current = newRoom;

//         // ✅ firstUser 지정 (닉네임이 유효할 때만)
//         if (newRoom.remoteParticipants.size === 0 && myNickname) {
//           setFirstUser((prev) => (prev !== myNickname ? myNickname : prev));
//         } else {
//           const [firstParticipant] = newRoom.remoteParticipants.values();
//           const participantNickname = firstParticipant?.metadata?.nickname;
//           if (participantNickname) {
//             setFirstUser((prev) =>
//               prev !== participantNickname ? participantNickname : prev
//             );
//           }
//         }

//         const handleTrackSubscribed = (track, publication, participant) => {
//           if (!participant || track.kind !== "video" || participant.isLocal) return;
//           const nickname = participant.metadata?.nickname || "unknown";
//           const subscriberObj = {
//             track,
//             identity: participant.identity,
//             nickname,
//           };
//           const updateTeam = (setter) => {
//             setter((prev) => {
//               if (prev.find((p) => p.identity === participant.identity)) return prev;
//               return [...prev, subscriberObj];
//             });
//           };
//           const team = participant.metadata?.team || "red";
//           if (team === "red") updateTeam(setRedTeam);
//           else updateTeam(setBlueTeam);
//         };

//         // 기존 참가자 처리
//         for (const participant of newRoom.remoteParticipants.values()) {
//           for (const publication of participant.trackPublications.values()) {
//             if (publication.isSubscribed && publication.track?.kind === "video") {
//               handleTrackSubscribed(publication.track, publication, participant);
//             }
//           }
//           participant.on(RoomEvent.TrackSubscribed, (track, publication) => {
//             handleTrackSubscribed(track, publication, participant);
//           });
//         }

//         // 새 참가자
//         newRoom.on(RoomEvent.ParticipantConnected, (participant) => {
//           participant.on(RoomEvent.TrackSubscribed, (track, publication) => {
//             handleTrackSubscribed(track, publication, participant);
//           });
//         });

//         // 참가자 퇴장 시 처리
//         newRoom.on(RoomEvent.ParticipantDisconnected, (participant) => {
//           setRedTeam((prev) =>
//             prev.filter((p) => p.identity !== participant.identity)
//           );
//           setBlueTeam((prev) =>
//             prev.filter((p) => p.identity !== participant.identity)
//           );
//         });
//       } catch (error) {
//         console.error("LiveKit 연결 실패:", error);
//       }
//     };

//     connectLiveKit();

//     return () => {
//       if (roomRef.current) roomRef.current.disconnect();
//     };
//   }, []); // ✅ 한 번만 실행

//   // ✅ 캠 캡처 후 FastAPI 전송
//   const handleCapture = async () => {
//     console.log("📸 사진 촬영 준비 중... 5초 뒤에 촬영됩니다!");

//     setTimeout(async () => {
//       const canvas = document.createElement("canvas");
//       const ctx = canvas.getContext("2d");
//       const formData = new FormData();

//       const captureTrack = (videoTrack, nickname) => {
//         return new Promise((resolve) => {
//           const videoEl = document.createElement("video");
//           videoEl.srcObject = new MediaStream([videoTrack.mediaStreamTrack]);
//           videoEl.muted = true;
//           videoEl.playsInline = true;

//           videoEl.addEventListener("loadeddata", async () => {
//             try {
//               await videoEl.play().catch(() => {
//                 console.warn("⚠️ 자동재생 차단됨: 사용자 액션 필요");
//               });

//               const doCapture = () => {
//                 const width = videoEl.videoWidth;
//                 const height = videoEl.videoHeight;

//                 canvas.width = width;
//                 canvas.height = height;
//                 ctx.drawImage(videoEl, 0, 0, width, height);

//                 canvas.toBlob((blob) => {
//                   const filename = `${nickname}.png`;
//                   formData.append("images", blob, filename);
//                   // ❌ track.stop() 제거 → 카메라 유지
//                   videoEl.remove(); 
//                   resolve();
//                 }, "image/png");
//               };

//               if (videoEl.requestVideoFrameCallback) {
//                 videoEl.requestVideoFrameCallback(doCapture);
//               } else {
//                 setTimeout(doCapture, 200);
//               }
//             } catch (err) {
//               console.error("비디오 캡처 실패:", err);
//               resolve();
//             }
//           });
//         });
//       };

//       // ✅ 본인 + 모든 참가자 캡처 (병렬 처리)
//       await Promise.all([
//         ...(publisherTrack ? [captureTrack(publisherTrack.track, myNickname)] : []),
//         ...redTeam.map((user) => captureTrack(user.track, user.nickname)),
//         ...blueTeam.map((user) => captureTrack(user.track, user.nickname)),
//       ]);

//       // ✅ FastAPI 전송
//       const fastapiUrl = import.meta.env.VITE_FASTAPI_URL;
//       try {
//         const res = await fetch(fastapiUrl, {
//           method: "POST",
//           body: formData,
//         });
//         if (!res.ok) throw new Error(`FastAPI 요청 실패: ${res.status}`);
//         const result = await res.json();
//         console.log("✅ FastAPI 응답:", result);
//       } catch (err) {
//         console.error("❌ FastAPI 전송 실패:", err);
//       }
//     }, 5000);
//   };


//   // ✅ LiveKit 토큰 요청 (변경 없음)
//   async function getToken(roomName, participantName) {
//     if (!accessToken) {
//       throw new Error("로그인이 필요합니다. accessToken 없음");
//     }
//     const apiUrl = import.meta.env.VITE_API_URL;
//     const res = await fetch(`${apiUrl}/rtc/token`, {
//       method: "POST",
//       headers: {
//         Authorization: `Bearer ${accessToken}`,
//         "Content-Type": "application/json",
//       },
//       body: JSON.stringify({ room: roomName, name: participantName, team: "red" }),
//     });

//     if (!res.ok) {
//       throw new Error("open vidu 토큰 요청 실패");
//     }

//     const tokenObj = await res.json();
//     return tokenObj.token;
//   }

//   return (
//     <div className="relative w-full h-screen overflow-hidden">
//       <img
//         src={background_sketchrelay}
//         alt="background"
//         className="absolute top-0 left-0 w-full h-full object-cover -z-10"
//       />
//       <div className="relative z-10 w-full h-full flex flex-col justify-between items-center py-12 px-10">

//         {/* 캠 출력 */}
//         <div className="flex gap-4 justify-center">
//           {[...(publisherTrack ? [publisherTrack] : []), ...redTeam, ...blueTeam].map((sub, i) => (
//             <div key={i} className="flex flex-col items-center">
//               <LiveKitVideo videoTrack={sub.track} isLocal={sub.identity === participantName} />
//               <p className="text-sm mt-1">{sub.nickname}</p>
//             </div>
//           ))}
//         </div>

//         {/* 사진 찍기 버튼 (첫 참가자만 보임) */}
//         {firstUser === myNickname && (
//           <button
//             onClick={handleCapture}
//             className="bg-yellow-400 px-4 py-2 rounded shadow-lg mt-4"
//           >
//             📸 사진 찰칵
//           </button>
//         )}

//         {/* 칠판 */}
//         <div className="w-[1200px] h-[600px] bg-white rounded-lg border-4 border-gray-300 shadow-inner my-6" />
//       </div>

//       <div className="absolute top-4 right-4 z-20">
//         <RoundInfo round={1} redScore={0} blueScore={0} />
//       </div>

//       <div className="absolute bottom-4 left-0 z-20">
//         <ChatBox width="300px" height="300px" />
//       </div>

//       <div className="absolute top-4 left-4 z-20 flex flex-col gap-2">
//         <button onClick={emitGameStart} className="bg-green-300 px-4 py-2 rounded">GAME_START</button>
//         <button onClick={emitTurnChange} className="bg-blue-300 px-4 py-2 rounded">TURN_CHANGE</button>
//         <button onClick={emitRoundOver} className="bg-red-300 px-4 py-2 rounded">ROUND_OVER</button>
//       </div>
//     </div>
//   );
// };

// export default SketchRelayPage_VIDU;