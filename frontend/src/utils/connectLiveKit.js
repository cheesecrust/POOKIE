// src/utils/connectLiveKit.js

import { Room, RoomEvent, createLocalVideoTrack } from "livekit-client";
import useGameStore from "../store/useGameStore";
import axiosInstance from "../lib/axiosInstance";

// [초기화 메서드] 게임 participant 전원 store에 선등록
const registerAllParticipants = ({ red, blue, repIdxList, norIdxList, myUserId, addParticipant }) => {
  const allUsers = [...red, ...blue];

  allUsers.forEach((u) => {
    const identity = String(u.id); // livekit ID
    const team = red.some(r => r.id === u.id) ? "RED" : "BLUE";
    const role = repIdxList.includes(u.id) ? "REP" : norIdxList.includes(u.id) ? "NOR" : null;

    // 전역에 'participant' 추가
    addParticipant({
      identity,
      track: null, // 트랙 추가X
      userAccountId: u.id,
      nickname: u.nickname,
      team,
      role,
      isLocal: u.id === myUserId, // 본인 여부 확인
    });
  });

  console.log("📌 전체 참가자 등록 완료");
};

// [트랙 수신 핸들러] 특정 participant의 트랙을 store에 반영
const handleTrackSubscribed = ({ participantId, track, updateParticipant }) => {
  const { participants } = useGameStore.getState(); // 현재 participants 목록 조회
  const existing = participants.find(p => p.identity === String(participantId)); // 해당 participant 조회

  if (!existing) return;

  // 해당 participant의 트랙 추가
  updateParticipant(participantId, {
    ...existing,
    track, // 트랙 추가O
  });

  console.log("✅ Track 갱신 완료:", participantId);
};

// [LiveKit 연결 메서드]
// 1) 토큰 발급 → 2) Room 연결 → 3) 이벤트 리스너 바인딩 → 4) 내 비디오 트랙 publish
const connectLiveKit = async (user) => {
  const {
    red,
    blue,
    roomId,
    repIdxList,
    norIdxList,
    addParticipant,
    updateParticipant,
    setRoomInstance,
  } = useGameStore.getState();

  try {
    const livekitUrl = import.meta.env.VITE_OPENVIDU_LIVEKIT_URL;
    const identity = String(user.userAccountId);

    console.log("🚀 LiveKit 연결 시작");
    console.log("🔍 내 userAccountId:", user.userAccountId);
    console.log("🔍 RED 리스트:", red.map(u => u.id));
    console.log("🔍 BLUE 리스트:", blue.map(u => u.id));

    // 1. 전체 참가자 store에 등록
    registerAllParticipants({
      red,
      blue,
      repIdxList,
      norIdxList,
      myUserId: user.userAccountId,
      addParticipant
    });

    // 2. 토큰 요청
    const tokenRes = await axiosInstance.post("/rtc/token", {
      room: roomId,
      name: identity,
    });
    const rtc_token = tokenRes.data.token;
    console.log("받은 rtcToken", rtc_token);

    // 3. roomInstance 생성
    const roomInstance = new Room();

    // [이벤트 리스너] 기존 participant의 트랙 구독 처리
    roomInstance.on(RoomEvent.TrackSubscribed, (track, publication,participant) => {
      const participantId = participant.identity;
      console.log("✅ 기존 참가자 트랙 구독됨:", participantId);
      handleTrackSubscribed({ participantId, track, updateParticipant });
    });

    // [이벤트 리스너] 다른 participant 연결 시,
    roomInstance.on(RoomEvent.ParticipantConnected, (participant) => {
      const participantId = participant.identity;
      console.log("🧍 참가자 연결됨:", participantId);

      // 해당 participant의 트랙 구독 처리
      participant.on(RoomEvent.TrackSubscribed, (track) => {
        console.log("🎥 TrackSubscribed 발생!", participantId);
        handleTrackSubscribed({
          participantId,
          track,
          red,
          blue,
          repIdxList,
          norIdxList,
          updateParticipant,
        });
      });
    });

    // 4. roomInstance 연결
    await roomInstance.connect(livekitUrl, rtc_token);
    console.log("✅ LiveKit 연결 성공");

    // 5. 내 비디오 트랙 생성
    const videoTrack = await createLocalVideoTrack();

    // store에 반영 (다른 유저가 구독할 가능성 대비)
    updateParticipant(identity, {
      track: videoTrack,
      isLocal: true,
    });

    // 6. 내 비디오 트랙 publish
    await roomInstance.localParticipant.publishTrack(videoTrack);
    console.log("🎥 내 비디오 트랙 publish 완료");

    // 7. roomInstance 전역에 저장
    setRoomInstance(roomInstance);
    console.log("📊 현재 participants 상태:", useGameStore.getState().participants);
    console.log("✅ LiveKit 연결 및 트랙 publish 완료");

  } catch (error) {
    console.error("❌ LiveKit 연결 실패:", error);
    alert("LiveKit 연결 실패");
  }
};

export default connectLiveKit;