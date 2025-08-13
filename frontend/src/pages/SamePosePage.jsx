// src/pages/SamePosePage.jsx

import RoundInfo from "../components/molecules/games/RoundInfo";
import toggle_left from "../assets/icon/toggle_left.png";
import ChatBox from "../components/molecules/common/ChatBox";
import PopUpModal from "../components/atoms/modal/PopUpModal";
import GameResultModal from "../components/organisms/games/GameResultModal";
import background_same_pose from "../assets/background/background_samepose.gif";
import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import useSound from "../utils/useSound";

import axios from "axios";

import useAuthStore from "../store/useAuthStore.js";
import useGameStore from "../store/useGameStore";
import { Room, RoomEvent, createLocalVideoTrack } from "livekit-client";
import LiveKitVideo from "../components/organisms/common/LiveKitVideo";
import connectLiveKit from "../utils/connectLiveKit";

import {
  emitAnswerSubmit,
  emitTurnOver,
  emitRoundOver,
  emitTimerStart,
} from "../sockets/game/emit.js";

const SamePosePage = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { playSound } = useSound();

  // 방정보
  const master = useGameStore((state) => state.master);
  const myIdx = user?.userAccountId;
  const roomId = useGameStore((state) => state.roomId);
  const roomInfo = useGameStore((state) => state.roomInfo);
  const isHost = user?.userAccountId === master; //방장 id

  // 턴 라운드 키워드
  const turn = useGameStore((state) => state.turn);
  const round = useGameStore((state) => state.round);

  // 제시어
  const keywordIdx = useGameStore((state) => state.keywordIdx);
  const keywordList = useGameStore((state) => state.keywordList);

  //타이머
  const time = useGameStore((state) => state.time);

  // 일심동체용 타이머
  const isSamePoseTimerEnd = useGameStore((state) => state.isSamePoseTimerEnd);
  const resetSamePoseTimerEnd = useGameStore(
    (state) => state.resetIsSamePoseTimerEnd
  );

  // 팀 구분
  const redTeam = useGameStore((state) => state.red) || [];
  const blueTeam = useGameStore((state) => state.blue) || [];
  const [publisherTrack, setPublisherTrack] = useState(null);

  const myTeam = redTeam.some((player) => player.userAccountId === myIdx)
    ? "RED"
    : blueTeam.some((player) => player.userAccountId === myIdx)
      ? "BLUE"
      : null;

  // 턴에 따라 위치 변환
  const isRedTurn = turn === "RED";

  // 게임 시 나빼고 가려야 함
  const [hideTargetIds, setHideTargetIds] = useState([]);
  const [countdown, setCountdown] = useState("");
  const [showModal, setShowModal] = useState(false);

  // norIdxList 가져오기
  const norIdxList = useGameStore((state) => state.norIdxList) || [];
  const repIdxList = useGameStore((state) => state.repIdxList);

  // 캡쳐
  const lastShotKeyRef = useRef("");
  const isCapturingRef = useRef(false); // 중복 방지용

  // livekit
  const participants = useGameStore((state) => state.participants);
  const roomInstance = useGameStore((state) => state.roomInstance);

  // 점수 관련
  const teamScore = useGameStore((state) => state.teamScore);
  const tempTeamScore = useGameStore((state) => state.tempTeamScore);
  const roundResult = useGameStore((state) => state.roundResult);
  const gameResult = useGameStore((state) => state.gameResult);
  const score = useGameStore((state) => state.score); // 현재라운드 현재 팀 점수

  // 최종 승자
  const win = useGameStore((state) => state.win);
  // 결과창
  const [isResultOpen, setIsResultOpen] = useState(false);

  // 모달
  const isGameStartModalOpen = useGameStore(
    (state) => state.isGamestartModalOpen
  );
  const isTurnModalOpen = useGameStore((state) => state.isTurnModalOpen);
  const closeGameStartModal = useGameStore(
    (state) => state.closeGamestartModal
  );
  const closeTurnModal = useGameStore((state) => state.closeTurnModal);
  const showTurnChangeModal = useGameStore(
    (state) => state.showTurnChangeModal
  ); // 턴 바뀔때 모달

  // 정답 오답 모달
  const isCorrectModalOpen = useGameStore((state) => state.isCorrectModalOpen);
  const closeCorrectModal = useGameStore((state) => state.closeCorrectModal);
  const isWrongModalOpen = useGameStore((state) => state.isWrongModalOpen);
  const closeWrongModal = useGameStore((state) => state.closeWrongModal);

  // 처리중..
  const [isProcessingModalOpen, setIsProcessingModalOpen] = useState(false);
  const [pendingAnswer, setPendingAnswer] = useState(false);
  const [serverVerdict, setServerVerdict] = useState(null);
  const didSubmitRef = useRef(false); // 중복 방지

  // 유저에게 찍힌 사진 보여주기
  const [capturePreviews, setCapturePreviews] = useState([]);

  // 첫시작 모달
  const handleTimerPrepareSequence = useGameStore(
    (state) => state.handleTimerPrepareSequence
  );
  const [isFirstLoad, setIsFirstLoad] = useState(true); // 첫 시작인지를 판단

  // 팀끼리 사진 캡쳐 (participants + role 기반) → FastAPI 업로드
  const handleCapture = async () => {
    if (!isHost) return; // ✅ 방장만 캡쳐/업로드
    if (!participants?.length) return; // (옵션) 트랙 준비 전엔 스킵
    console.log("📸 사진 촬영 시작");

    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const formData = new FormData();

    // 단일 트랙 캡처
    const captureTrack = (trackObj, nickname) => {
      return new Promise((resolve) => {
        if (!trackObj?.mediaStreamTrack) return resolve(null);

        const videoEl = document.createElement("video");
        videoEl.srcObject = new MediaStream([trackObj.mediaStreamTrack]);
        videoEl.muted = true;
        videoEl.playsInline = true;

        videoEl.addEventListener("loadedmetadata", async () => {
          try {
            await videoEl.play().catch(() => {});

            const doCapture = () => {
              const w = videoEl.videoWidth || 640;
              const h = videoEl.videoHeight || 480;
              canvas.width = w;
              canvas.height = h;
              ctx.drawImage(videoEl, 0, 0, w, h);

              // JPEG로 용량 ↓ (413 방지)
              canvas.toBlob(
                (blob) => {
                  if (blob) {
                    // 1) 업로드용
                    formData.append("images", blob, `${nickname}.jpg`);
                    // 2) 모달 표시용 미리보기 URL
                    const url = URL.createObjectURL(blob);
                    resolve({ url });
                  } else {
                    resolve(null);
                  }
                  videoEl.remove();
                },
                "image/jpeg",
                0.9
              );
            };

            if ("requestVideoFrameCallback" in HTMLVideoElement.prototype) {
              videoEl.requestVideoFrameCallback(() => doCapture());
            } else {
              requestAnimationFrame(() => setTimeout(doCapture, 50));
            }
          } catch (err) {
            console.error("❌ 비디오 캡처 실패:", err);
            resolve(null);
          }
        });
      });
    };

    // 1) 현재 턴 팀 + REP 우선, 부족하면 같은 팀에서 보충 → 최대 3명
    let targets = participants.filter(
      (p) => p.team === turn && p.role === "REP" && p.track?.mediaStreamTrack
    );
    if (targets.length < 3) {
      const fillers = participants
        .filter(
          (p) =>
            p.team === turn &&
            p.track?.mediaStreamTrack &&
            !targets.some((t) => t.identity === p.identity)
        )
        .slice(0, 3 - targets.length);
      targets = [...targets, ...fillers];
    }
    targets = targets.slice(0, 3);

    if (targets.length === 0) {
      console.warn("⚠️ 캡처 가능한 대상이 없습니다. (현재 턴 팀에 트랙 없음)");
      return;
    }

    console.log(
      "🎯 업로드 캡처 대상:",
      targets.map((t) => `${t.nickname}(${t.role ?? "NOR"})`)
    );

    // 병렬 캡처
    const results = await Promise.all(
      targets.map((p) => captureTrack(p.track, p.nickname))
    );
    const previews = results.filter(Boolean).map((r) => r.url);

    // 기존 URL revoke 후 교체
    capturePreviews.forEach((u) => URL.revokeObjectURL(u));
    setCapturePreviews(previews);

    // 메타데이터 추가 (원하면 확장)
    formData.append(
      "meta",
      JSON.stringify({
        roomId,
        round,
        turn,
        keyword: keywordList?.[keywordIdx] ?? null,
        capturedAt: new Date().toISOString(),
      })
    );

    // 업로드
    console.log("🚀 업로드 시작:", import.meta.env.VITE_FASTAPI_URL);

    try {
      const base = import.meta.env.VITE_FASTAPI_URL; // 도메인 또는 최종 엔드포인트
      // 절대 URL이 아니면 현재 오리진 기준으로 보정
      const u = /^https?:\/\//.test(base)
        ? new URL(base)
        : new URL(base, window.location.origin);

      // /ai/upload_images가 없으면 붙이기
      if (!/\/ai\/upload_images\/?$/.test(u.pathname)) {
        u.pathname = `${u.pathname.replace(/\/$/, "")}/ai/upload_images`;
      }

      // 쿼리 파라미터
      u.searchParams.set("gameId", String(roomId));
      u.searchParams.set("team", String(turn).toLowerCase()); // 서버가 소문자 받는다면 OK
      u.searchParams.set("round", String(round));

      const uploadUrl = u.toString();
      console.log("🧭 최종 업로드 URL:", uploadUrl);

      // 헤더 지정 X (브라우저가 boundary 자동 설정)
      const res = await axios.post(
        uploadUrl,
        formData /* , { withCredentials: true } 쿠키 필요 시 */
      );
      console.log("✅ 업로드 성공:", res.data);
      const verdict =
        typeof res.data === "boolean"
          ? res.data
          : typeof res.data === "string"
            ? res.data.toLowerCase() === "true"
            : Boolean(
                res.data?.success ?? res.data?.match ?? res.data?.ok ?? false
              );

      setServerVerdict(verdict);
      setPendingAnswer(true); // 이후 타이머 타이밍 맞춰 제출
    } catch (err) {
      const msg =
        err.response?.data ||
        err.response?.statusText ||
        err.message ||
        "unknown error";
      console.error("❌ 업로드 실패:", msg);
      setServerVerdict(false);
      setPendingAnswer(true);
    }
  };

  // 정답제출
  const submitGameAnswer = (isCorrect) => {
    const state = useGameStore.getState();
    const { roomId, round, keywordList, keywordIdx, participants, turn } =
      state;

    // ✅ 방장만 제출
    if (!isHost) {
      console.warn("⚠️ 방장이 아니므로 정답 제출 안 함");
      return;
    }

    // 현재 턴 팀의 NOR 중 한 명 선택 (없으면 방장 본인)
    const nors = participants.filter(
      (p) => p.team === turn && (p.role === null || p.role === "NOR")
    );
    const norId = nors[0] ? Number(nors[0].identity) : myIdx;

    emitAnswerSubmit({
      roomId,
      round,
      norId,
      keywordIdx,
      inputAnswer: isCorrect ? (keywordList?.[keywordIdx] ?? "") : "",
    });

    console.log("📝 GAME_ANSWER_SUBMIT(방장)", {
      roomId,
      round,
      norId,
      keywordIdx,
      inputAnswer: isCorrect ? keywordList?.[keywordIdx] : "",
    });
  };

  // 첫 페이지 로딩
  useEffect(() => {
    setTimeout(() => {
      handleTimerPrepareSequence(roomId);
    }, 3000);
  }, [roomId]);

  // 턴 바뀔 때 턴 모달 띄움
  useEffect(() => {
    // 첫 로딩(게임 시작) 제외
    if (!isFirstLoad) {
      showTurnChangeModal();
    } else {
      setIsFirstLoad(false);
    }
  }, [turn]);

  // 타이머 모달 => hide모달로 유저 가리기
  useEffect(() => {
    if (time === 8) {
      setCountdown(3);
      setShowModal(true);
    }

    if (time === 7) {
      setCountdown(2);
    }

    if (time === 6) {
      setCountdown(1);
    }

    if (time === 5) {
      setCountdown("찰 칵 !");
      setTimeout(() => {
        setShowModal(false);
      }, 1000);
    }
  }, [time]);

  // 처리중 모달
  useEffect(() => {
    if (time === 3 || time === 2) {
      setIsProcessingModalOpen(true);
    } else {
      setIsProcessingModalOpen(false);
    }
  }, [time]);

  // 일치 모달 - 일부러 pending
  useEffect(() => {
    if (!pendingAnswer) return;
    if (!isHost) return; // 방장만 제출
    if (didSubmitRef.current) return; // 중복 방지
    if (serverVerdict === null) return;

    // 처리중 모달 로직: time === 3 || time === 2 에서 열림 → 그 이후(<=1)면 닫힘
    if (time <= 1) {
      didSubmitRef.current = true;
      submitGameAnswer(serverVerdict);
      setPendingAnswer(false);
      setServerVerdict(null);
      // 다음 턴/라운드에서 다시 쓸 수 있게 약간의 딜레이 후 리셋
      setTimeout(() => {
        didSubmitRef.current = false;
      }, 500);
    }
  }, [pendingAnswer, serverVerdict, time, isHost]);

  // turn 변환 (레드팀 -> 블루팀), 라운드 변환 (블루 -> 레드)
  useEffect(() => {
    if (!isSamePoseTimerEnd) return;
    if (myIdx !== master) return;

    if (turn === "RED") {
      emitTurnOver({ roomId, team: turn, score });
      setTimeout(() => {
        emitTimerStart({ roomId });
      }, 2000);
    } else if (turn === "BLUE") {
      emitRoundOver({ roomId, team: turn, score });
      if (round < 3) {
        setTimeout(() => {
          emitTimerStart({ roomId });
        }, 2000);
      }
    }
    resetSamePoseTimerEnd();
  }, [isSamePoseTimerEnd, master, myIdx, round, roomId, score, turn]);

  // hideModal 대상 계산 => 나중에 수정
  useEffect(() => {
    if (!myIdx) return;

    // 내 정보/팀
    const me = participants.find((p) => Number(p.identity) === Number(myIdx));
    const myTeamName =
      me?.team ??
      (redTeam.some((p) => p.userAccountId === myIdx) ? "RED" : "BLUE");
    const isMyTurn = myTeamName === turn;

    // 이번 턴의 REP만 뽑아 ID 통일(Number(identity))
    const repIdsThisTurn = participants
      .filter((p) => p.role === "REP" && p.team === turn)
      .map((p) => Number(p.identity));
    if (isMyTurn) {
      // 내 턴일 때 → 같은 팀 NOR 멤버 중 나 제외하고만 보여줌
      setHideTargetIds(repIdsThisTurn.filter((id) => id !== Number(myIdx)));
    } else {
      // 내 턴 아닐 때 → 상대팀 REP 전부 보여줌
      setHideTargetIds(repIdsThisTurn);
    }
  }, [turn, participants, redTeam, blueTeam, myIdx]);

  useEffect(() => {
    // "찰 칵 !" 순간 자동 촬영 (방장만)
    if (!isHost) return;
    if (!showModal || countdown !== "찰 칵 !") return;

    const shotKey = `${round}-${turn}`;
    if (lastShotKeyRef.current === shotKey) return; // 같은 턴/라운드 중복 방지
    if (isCapturingRef.current) return;

    isCapturingRef.current = true;
    lastShotKeyRef.current = shotKey;

    (async () => {
      try {
        await handleCapture(); // ← 네가 이미 만든 함수 (다운로드까지 수행)
      } finally {
        // 살짝 딜레이 후 락 해제 (렌더/타이밍 안정화)
        setTimeout(() => {
          isCapturingRef.current = false;
        }, 300);
      }
    })();
  }, [isHost, showModal, countdown, round, turn]);

  // 메모리 누수 방지: URL revoke
  useEffect(() => {
    return () => {
      capturePreviews.forEach((u) => URL.revokeObjectURL(u));
    };
  }, []);

  // 최종 누가 이겼는지
  useEffect(() => {
    if (win) {
      setIsResultOpen(true);

      const modalTimeout = setTimeout(() => {
        setIsResultOpen(false);
        navigate(`/waiting/${roomId}`, { state: { room: roomInfo } });
        useGameStore.getState().setIsNormalEnd(true);
        useGameStore.getState().setIsAbnormalPerson(null);
      }, 4000);

      return () => {
        clearTimeout(modalTimeout);
      };
    }
  }, [win, navigate, roomId, roomInfo]);

  // Livekit 연결
  useEffect(() => {
    if (!user || !roomId || roomInstance || participants.length > 0) return;
    console.log("🚀 LiveKit 연결 시작");

    connectLiveKit(user);
  }, [user, roomId]);

  // 역할 부여 (SilentScreamPage fallback)
  useEffect(() => {
    const hasRole = participants.some((p) => p.role);
    const hasEnoughData = repIdxList.length > 0;

    if (!hasRole && hasEnoughData) {
      useGameStore.getState().setGameRoles2({ repIdxList });
      console.log("🛠 역할 수동 설정 완료: SamePosePage fallback");
    }
  }, [repIdxList, participants]);

  // livekit 렌더 함수
  const renderVideoByRole = (roleGroup, sizeStyles) => {
    return roleGroup.map((p, idx) => {
      const userAccountId = Number(p.identity);
      const isMe = userAccountId === user.userAccountId;

      return (
        <div key={p.identity} className={`relative z-10 ${sizeStyles[idx]}`}>
          <LiveKitVideo
            videoTrack={p.track}
            nickname={p.nickname}
            isLocal={p.isLocal}
            containerClassName={`${sizeStyles[idx]} relative`}
            nicknameClassName={`absolute bottom-2 left-2 text-lg bg-black/50 px-2 py-1 rounded ${
              isMe ? "text-yellow-400" : "text-white"
            }`}
          />
          {showModal && hideTargetIds.includes(userAccountId) && (
            <div className="absolute inset-0 z-20 bg-rose-50 bg-opacity-70 flex items-center justify-center text-rose-500 text-4xl font-bold pointer-events-none">
              {countdown}
            </div>
          )}
        </div>
      );
    });
  };

  const repStyles = [
    "w-100 h-75 rounded-lg shadow-lg",
    "w-100 h-75 rounded-lg shadow-lg",
    "w-100 h-75 rounded-lg shadow-lg",
  ];

  const enemyStyles = [
    "w-75 h-50 rounded-lg shadow-lg",
    "w-75 h-50 rounded-lg shadow-lg",
    "w-75 h-50 rounded-lg shadow-lg",
  ];

  // 분류 후 자동 배치
  const enemyTeam = turn === "RED" ? "BLUE" : "RED"; // 반대 팀 계산
  const repGroup = participants.filter((p) => p.role === "REP");
  const enemyGroup = participants.filter(
    (p) => p.role === null && p.team === enemyTeam
  );

  // 모달 사운드
  useEffect(() => {
    if (isGameStartModalOpen) {
      playSound("game_start");
    }
  }, [isGameStartModalOpen, playSound]);

  useEffect(() => {
    if (isTurnModalOpen) {
      playSound("turn_change");
    }
  }, [isTurnModalOpen, playSound]);

  useEffect(() => {
    if (isResultOpen) {
      playSound("game_over");
    }
  }, [isResultOpen, playSound]);

  // 게임 정상 종료 여부
  const isNormalEnd = useGameStore((state) => state.isNormalEnd);
  const isAbnormalPerson = useGameStore((state) => state.isAbnormalPerson);

  return (
    <>
      <div
        className={`flex flex-col h-screen bg-cover bg-center ${
          isResultOpen ? "blur-sm" : ""
        }`}
        style={{ backgroundImage: `url(${background_same_pose})` }}
      >
        <section className="basis-3/9 flex flex-col p-4">
          <div className="grid grid-cols-3 items-center gap-6 px-6">
            <div className="col-span-1 flex justify-start">
              <div className="text-sm text-gray-800 leading-tight w-full max-w-[300px]">
                <span className="mb-2 block">제시어에 맞게</span>
                <span className="mb-2 block">
                  최대한 <b className="text-pink-500">정자세</b>에서 동작을
                  취해주세요.
                </span>
                <span className="block">
                  <b className="text-cyan-500">손</b>을 정확히 보여야
                </span>
                <span>정확한 판정이 가능합니다 !</span>
              </div>
            </div>

            <div className="col-span-1 flex flex-col items-center">
              <div className="relative text-center text-2xl mb-3">
                <span
                  className={turn === "RED" ? "text-red-500" : "text-blue-700"}
                >
                  {turn}
                </span>{" "}
                <span className="text-black">TEAM TURN</span>
              </div>
              <div className="flex flex-col items-center justify-center bg-[#FFDBF7] rounded-xl shadow-lg w-full max-w-[400px] h-[170px] gap-5">
                <div className="text-2xl text-pink-500 font-bold flex flex-row items-center">
                  <img src={toggle_left} alt="icon" className="w-5 h-5 mr-2" />
                  <p>제시어</p>
                </div>
                <p className="text-2xl font-semibold text-black mt-2 text-center">
                  {keywordList?.[keywordIdx] ?? "제시어를 가져오는 중..."}
                </p>
              </div>
            </div>

            {/* 라운드, 점수 */}
            <div className="col-span-1 flex justify-end">
              <RoundInfo
                round={round}
                redScore={teamScore?.RED}
                blueScore={teamScore?.BLUE}
              />
            </div>
          </div>
        </section>

        {/* 현재 팀 캠 영역 (REP) */}
        <section
          className={`basis-4/9 relative w-full h-full flex justify-around items-center ${
            turn === "RED" ? "bg-red-100" : "bg-blue-100"
          }`}
        >
          {renderVideoByRole(repGroup, repStyles)}
        </section>

        {/* 상대 팀 캠 영역 (NOR) */}
        <section className="basis-3/9 relative w-full h-[180px] mt-auto flex justify-around items-end">
          <div className="basis-1/3"></div>
          {/* <div className="absolute bottom-[70px] right-12 text-2xl font-bold">
            {turn === "RED" ? "BLUE TEAM" : "RED TEAM"}
          </div> */}
          <div className="basis-2/3 flex flex-row justify-around p-4">
            {renderVideoByRole(enemyGroup, enemyStyles)}
          </div>
        </section>

        {/* Chatbox */}
        <div className="absolute bottom-4 left-10 z-20 opacity-90">
          <ChatBox width="350px" height="250px" roomId={roomId} team={myTeam} />
        </div>

        {/* GAME START 모달 */}
        <PopUpModal
          isOpen={isGameStartModalOpen}
          onClose={() => closeGameStartModal()}
        >
          <p className="text-6xl font-bold font-pixel">GAME START</p>
        </PopUpModal>

        {/* 턴 모달 */}
        <PopUpModal isOpen={isTurnModalOpen} onClose={() => closeTurnModal()}>
          <p className="text-6xl font-bold font-pixel">
            {turn === "RED" ? "RED TEAM TURN" : "BLUE TEAM TURN"}
          </p>
        </PopUpModal>
      </div>

      {/* 정답 모달 */}
      <PopUpModal isOpen={isCorrectModalOpen} onClose={closeCorrectModal}>
        <p className="text-6xl font-bold font-pixel text-cyan-600">일 치 !</p>
      </PopUpModal>

      {/* 오답 모달 */}
      <PopUpModal isOpen={isWrongModalOpen} onClose={closeWrongModal}>
        <p className="text-6xl font-bold font-pixel text-pink-600">
          불 일 치 !
        </p>
      </PopUpModal>

      {/* 처리중 모달 */}
      <PopUpModal
        isOpen={isProcessingModalOpen}
        onClose={() => setIsProcessingModalOpen(false)}
      >
        <div className="flex flex-col items-center gap-6">
          <p className="text-4xl font-bold font-pixel">처 리 중...</p>
          {capturePreviews?.length > 0 && (
            <div className="grid grid-cols-3 gap-2 bg-pink-500 p-4">
              {capturePreviews.map((src, i) => (
                <img
                  key={i}
                  src={src}
                  alt={`capture-${i}`}
                  className="w-45 h-45 object-cover rounded-lg shadow transform -scale-x-100"
                />
              ))}
            </div>
          )}
        </div>
      </PopUpModal>

      {/* 최종 승자 모달 */}
      {isResultOpen && (
        <GameResultModal
          win={win}
          isNormalEnd={isNormalEnd}
          isAbnormalPerson={isAbnormalPerson}
          redTeam={redTeam}
          blueTeam={blueTeam}
          onClose={() => setIsResultOpen(false)}
        />
      )}
    </>
  );
};

export default SamePosePage;
