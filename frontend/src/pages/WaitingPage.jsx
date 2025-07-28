// src/pages/WaitingPage.jsx
import ModalButton from '../components/atoms/button/ModalButton';
import TeamToggleButton from '../components/molecules/games/TeamToggleButton';
import SelfCamera from '../components/molecules/waiting/SelfCamera';
import WaitingUserList from '../components/organisms/waiting/WaitingUserList';
import bgImage from '../assets/background/background_waiting.png';
import ChatBox from '../components/molecules/common/ChatBox';
import RoomExitModal from '../components/organisms/waiting/RoomExitModal';

import { useNavigate, useParams } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { connectSocket, closeSocket } from '../sockets/common/websocket';
import {
	emitTeamChange,
	emitReadyChange,
	emitLeaveRoom,
	emitStartGame,
	emitForceRemove,
} from '../sockets/waiting/emit';
import useAuthStore from '../store/store';

const WaitingPage = () => {
	const navigate = useNavigate();
	const { roomId } = useParams();
	const { user, accessToken } = useAuthStore();

	const [room, setRoom] = useState(null);
	const [team, setTeam] = useState(null);
	const [isReady, setIsReady] = useState(false);
	const [isExitModalOpen, setIsExitModalOpen] = useState(false);
	const [kickModalOpen, setKickModalOpen] = useState(false); // 모달 열림 여부
	const [kickTarget, setKickTarget] = useState(null); // 강퇴 대상 유저 정보

	const isHost = room?.master?.id === user?.id;

	const handleLeaveRoom = () => {
		emitLeaveRoom({ roomId });
		closeSocket();
		navigate('/home');
	};

	const handleStartGame = () => {
		emitStartGame({ roomId });
	};

	const handleTeamToggle = () => {
		const toTeam = team === 'RED' ? 'BLUE' : 'RED';
		console.log('emitTeamChange 실행:', toTeam);
		emitTeamChange({ roomId, curTeam: toTeam });
	};

	const handleReadyToggle = () => {
		emitReadyChange({ roomId, team });
		setIsReady(!isReady);
	};

	const handleKickConfirm = () => {
		emitForceRemove({
			roomId,
			removeTargetId: kickTarget.userId,
			removeTargetNickname: kickTarget.userNickname,
			removeTargetTeam: kickTarget.team,
		});
		setKickModalOpen(false);
	};

	useEffect(() => {
		if (!accessToken || !user) return;

		connectSocket({
			url: 'wss://i13a604.p.ssafy.io/api/game',
			token: accessToken,

			// 서버에서 응답받는거
			onMessage: (e) => {
				const data = JSON.parse(e.data);
				if (!data.type) return;

				switch (data.type) {
					case 'ROOM_JOINED':
					case 'USER_TEAM_CHANGED':
					case 'USER_READY_CHANGED':
					case 'PLAYER_LEFT': {
						setRoom(data.room);

						// 본인 팀색 찾는 로직
						const myTeam = Object.entries({
							RED: data.room.RED,
							BLUE: data.room.BLUE,
						}).find(([_, users]) => users.some((u) => u.id === user.id))?.[0];

						setTeam(myTeam);

						const me = data.room[myTeam]?.find((u) => u.id === user.id);
						setIsReady(me?.status === 'READY');
						break;
					}

					case 'LEAVE':
						if (data.msg === 'Lobby 로 돌아갑니다.') {
							closeSocket();
							navigate('/home');
						}
						break;

					case 'STARTED_GAME': {
						const gameType = room?.gameType?.toLowerCase();
						const roomIdFromState = room?.id;
						if (gameType && roomIdFromState) {
							navigate(`/${gameType}/${roomIdFromState}`);
						}
						break;
					}

					case 'ERROR':
						alert(data.msg);
						break;
				}
			},
			onOpen: () => {
				// emitJoinRoom은 이전 페이지에서 처리함
			},
			onClose: closeSocket,
			onError: console.error,
		});

		return () => closeSocket();
	}, [accessToken, user, roomId]);

	// 유저 카드리스트 내용
	const userSlots = room
		? [...room.RED, ...room.BLUE].map((u) => ({
				userId: u.id,
				userNickname: u.nickname,
				team: room.RED.some((r) => r.id === u.id) ? 'red' : 'blue',
				isReady: u.status === 'READY',
				isHost: room.master?.id === u.id,
				reqImg: u.repImg,
			}))
		: [];

	const isStartEnabled =
		isHost &&
		room?.RED.length > 0 &&
		room?.RED.length === room?.BLUE.length &&
		[...room.RED, ...room.BLUE].every((u) => u.status === 'READY');

	return (
		<div className="flex flex-row h-screen">
			<section
				className="basis-3/4 flex flex-col"
				style={{
					backgroundImage: `url(${bgImage})`,
					backgroundSize: 'cover',
					backgroundPosition: 'center',
					backgroundRepeat: 'no-repeat',
				}}
			>
				<div className="basis-1/5 flex flex-row justify-between items-center">
					<h1 className="p-4 text-3xl">{room?.title ?? 'room_list'}</h1>
					<div className="flex flex-col gap-1 p-2 items-end">
						{isHost && !isStartEnabled && (
							<span className="text-sm text-red-700 font-bold">
								모든 유저가 준비 완료되어야 시작할 수 있습니다.
							</span>
						)}
						<div className="flex flex-row gap-2">
							<TeamToggleButton currentTeam={team} onClick={handleTeamToggle} />
							{isHost ? (
								<ModalButton onClick={handleStartGame} disabled={!isStartEnabled}>
									START
								</ModalButton>
							) : (
								<ModalButton onClick={handleReadyToggle}>
									{isReady ? '준비 해제' : '준비 완료'}
								</ModalButton>
							)}
						</div>
					</div>
				</div>

				<div className="basis-4/5">
					<div className="h-full bg-transparent flex flex-col items-stretch justify-center">
						<WaitingUserList
							userSlots={userSlots}
							roomMasterId={room?.master?.id}
							onRightClickKick={(user) => {
								setKickTarget(user);
								setKickModalOpen(true);
							}}
						/>
					</div>
				</div>
			</section>

			<section className="basis-1/4 flex flex-col bg-rose-300">
				<div className="basis-1/8 m-4 flex justify-end items-center">
					<ModalButton className="text-lg px-2 py-1 rounded-md" onClick={() => setIsExitModalOpen(true)}>
						방 나가기
					</ModalButton>
				</div>

				<div className="basis-3/8 flex flex-col justify-center items-center">
					<SelfCamera />
				</div>

				<div className="basis-4/8 relative">
					<div className="absolute bottom-0">
						<ChatBox width="300px" height="250px" />
					</div>
				</div>
			</section>

			<RoomExitModal
				isOpen={isExitModalOpen}
				onConfirm={handleLeaveRoom}
				onCancel={() => setIsExitModalOpen(false)}
			/>
			<KickConfirmModal
				isOpen={kickModalOpen}
				kickTarget={kickTarget}
				onConfirm={handleKickConfirm}
				onCancel={() => setKickModalOpen(false)}
			/>
		</div>
	);
};

export default WaitingPage;

// // src/pages/WaitingPage.jsx
// import ModalButton from "../components/atoms/button/ModalButton";
// import BasicButton from "../components/atoms/button/BasicButton";
// import TeamToggleButton from "../components/molecules/games/TeamToggleButton";
// import SelfCamera from "../components/molecules/waiting/SelfCamera";
// import WaitingUserList from "../components/organisms/waiting/WaitingUserList";
// import bgImage from "../assets/background/background_waiting.png";
// import ChatBox from "../components/molecules/common/ChatBox";
// import RoomExitModal from "../components/organisms/waiting/RoomExitModal";

// import { useNavigate } from "react-router-dom";
// import { useState, useEffect } from "react";

// // 실제로는 안쓰는 더미 데이터
// const dummyUsers = [
//   {
//     id: "u1",
//     username: "Pookie",
//     character: "", // 혹은 null
//     team: "red",
//     isReady: true,
//     isHost: true,
//   },
//   {
//     id: "u2",
//     username: "Choco",
//     character: "", // 또는 null
//     team: "blue",
//     isReady: false,
//     isHost: false,
//   },
//   {
//     id: "u3",
//     username: "Banana",
//     character: "", // 또는 null
//     team: "red",
//     isReady: true,
//     isHost: false,
//   },
// ];

// // WaitingPage 컴포넌트
// const WaitingPage = () => {
//   // useNavigate 훅을 사용한 페이지 이동 기능
//   const navigate = useNavigate();

//   // 방을 나가게 되면 socket 연결을 끊고 메인 페이지로 이동하는 함수 필요
//   const handleLeaveRoom = () => {
//     // 방 나가기 로직
//     console.log("방을 나가기");
//     // 방 나간 후 메인 페이지로 이동
//     navigate("/home");
//   };

//   // 방 나가기 모달 상태 관리
//   const [isExitModalOpen, setIsExitModalOpen] = useState(false);

//   // ##### 방장인 경우의 프론트 예
//   const isHost = true; // 예시로 방장인 경우

//   const handleStartGame = () => {
//     if (isHost) {
//       // 방장일 때 게임 시작 로직
//       console.log("게임 시작");
//       // 예: socket.emit('startGame');
//       navigate("/sketchrelay"); // 게임 페이지로 이동
//     } else {
//       // 방장이 아닐 때는 아무 동작도 하지 않음
//       console.log("방장이 아닙니다.");
//     }
//   };

//   // 레디 상태 버튼 누르면 사용자의 레디 상태를 서버에 보내야 함

//   const [userSlots, setUserSlots] = useState([
//     null,
//     null,
//     null,
//     null,
//     null,
//     null,
//   ]);

//   // ######### 테스트용
//   useEffect(() => {
//     // 테스트: 첫 유저 1초 후 입장, 두 번째는 2초, 세 번째는 3초 후 입장
//     dummyUsers.forEach((user, i) => {
//       setTimeout(
//         () => {
//           setUserSlots((prev) => {
//             const next = [...prev];
//             const emptyIndex = next.findIndex((slot) => slot === null);

//             // 이미 입장한 유저가 다시 들어오지 않도록 확인
//             const alreadyExists = next.some((slot) => slot?.id === user.id);
//             if (emptyIndex !== -1 && !alreadyExists) {
//               next[emptyIndex] = user;
//             }

//             return next;
//           });
//         },
//         (i + 1) * 1000
//       );
//     });
//   }, []);

//   return (
//     // 1. 전체 페이지를 flex로 설정하여 세로 방향으로 정렬
//     <div className="flex flex-row h-screen">
//       {/* 좌측 전체 박스 */}
//       <section
//         className="basis-3/4 flex flex-col"
//         style={{
//           backgroundImage: `url(${bgImage})`,
//           backgroundSize: "cover",
//           backgroundPosition: "center",
//           backgroundRepeat: "no-repeat",
//         }}
//       >
//         {/* 상하 박스    위: 방제, 버튼 */}
//         <div className="basis-1/5 flex flex-row justify-between items-center">
//           <h1 className="p-4 text-3xl">room_list</h1>
//           <div className="flex flex-row gap-2 p-2">
//             <BasicButton>team</BasicButton>

//             {/* 방장이라면 start를 봐야함 */}
//             {isHost ? (
//               <ModalButton onClick={handleStartGame}>START</ModalButton>
//             ) : (
//               <ModalButton>READY</ModalButton>
//             )}
//           </div>
//         </div>

//         {/* 아래: 유저 카드 리스트 */}
//         <div className="basis-4/5">
//           <div
//             className="h-full bg-transparent flex flex-col items-stretch justify-center
//         "
//           >
//             <WaitingUserList userSlots={userSlots} />
//           </div>
//         </div>
//       </section>

//       {/* 우측 전체 박스 */}
//       <section className="basis-1/4 flex flex-col bg-rose-300">
//         <div className="basis-1/8 m-4 flex justify-end items-center">
//           <ModalButton
//             className="text-lg px-2 py-1 rounded-md"
//             onClick={() => setIsExitModalOpen(true)}
//           >
//             방 나가기
//           </ModalButton>
//         </div>

//         {/*  */}
//         <div className="basis-3/8 flex flex-col justify-center items-center">
//           <SelfCamera />
//         </div>

//         <div className="basis-4/8 relative">
//           <div className="absolute bottom-0">
//             <ChatBox width="300px" height="250px" />
//           </div>
//         </div>
//       </section>

//       {/* 방 나가기 모달 */}
//       <RoomExitModal
//         isOpen={isExitModalOpen}
//         onConfirm={handleLeaveRoom}
//         onCancel={() => setIsExitModalOpen(false)}
//       />
//     </div>
//   );
// };

// export default WaitingPage;
