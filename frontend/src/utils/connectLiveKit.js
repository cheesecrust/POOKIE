// src/utils/connectLiveKit.js

import { Room, RoomEvent, createLocalVideoTrack } from "livekit-client";
import useGameStore from "../store/useGameStore";
import axiosInstance from "../lib/axiosInstance";

// 참가자 전체 선등록 함수
const registerAllParticipants = ({ red, blue, repIdxList, norIdxList, myUserId, addParticipant }) => {
  const allUsers = [...red, ...blue];

  allUsers.forEach((u) => {
    const identity = String(u.id);
    const team = red.some(r => r.id === u.id) ? "RED" : "BLUE";
    const role = repIdxList.includes(u.id) ? "REP" : norIdxList.includes(u.id) ? "NOR" : null;

    addParticipant({
      identity,
      track: null,
      userAccountId: u.id,
      nickname: u.nickname,
      team,
      role,
      isLocal: u.id === myUserId,
    });
  });

  console.log("📌 전체 참가자 등록 완료");
};

// trackSubscribed 핸들러
const handleTrackSubscribed = ({ participantId, track, updateParticipant }) => {
  const { participants } = useGameStore.getState();
  const existing = participants.find(p => p.identity === String(participantId));

  if (!existing) return;

  updateParticipant(participantId, {
    ...existing,
    track,
  });

  console.log("✅ Track 갱신 완료:", participantId);
};

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
    setGameRoles,
  } = useGameStore.getState();

  try {
    const livekitUrl = import.meta.env.VITE_OPENVIDU_LIVEKIT_URL;
    const identity = String(user.userAccountId);

    console.log("🚀 LiveKit 연결 시작");
    console.log("🔍 내 userAccountId:", user.userAccountId);
    console.log("🔍 RED 리스트:", red.map(u => u.id));
    console.log("🔍 BLUE 리스트:", blue.map(u => u.id));

    // 1. 전체 참가자 등록
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

    // 3. LiveKit 연결
    const roomInstance = new Room();

    // ✅ 기존 참가자 track 구독 전역 처리
    roomInstance.on(RoomEvent.TrackSubscribed, (track, publication, participant) => {
      const participantId = participant.identity;
      console.log("✅ 기존 참가자 track 구독됨:", participantId);
      handleTrackSubscribed({ participantId, track, updateParticipant });
    });

    // 5. 다른 참가자 연결 시
    roomInstance.on(RoomEvent.ParticipantConnected, (participant) => {
      const participantId = participant.identity;
      console.log("🧍 참가자 연결됨:", participantId);

      // ✅ 무조건 TrackSubscribed 바인딩
      participant.on(RoomEvent.TrackSubscribed, (track) => {
        console.log("🎥 TrackSubscribed 발생!", participantId);
        handleTrackSubscribed({
          participantId,
          track,
          red,
          blue,
          repIdxList,
          norIdxList,
          updateParticipant
        });
      });
    });

    await roomInstance.connect(livekitUrl, rtc_token);
    console.log("✅ LiveKit 연결 성공");

    // 4. 내 비디오 publish
    const videoTrack = await createLocalVideoTrack();

    // ✅ 먼저 store에 반영 (다른 유저가 구독할 가능성 대비)
    updateParticipant(identity, {
      track: videoTrack,
      isLocal: true,
    });

    await roomInstance.localParticipant.publishTrack(videoTrack);
    console.log("🎥 내 비디오 track publish 완료");

    // 6. roomInstance 저장
    setRoomInstance(roomInstance);
    console.log("📊 현재 participants 상태:", useGameStore.getState().participants);
    console.log("✅ 모든 LiveKit 참가자 초기 연결 완료");

  } catch (error) {
    console.error("❌ LiveKit 연결 실패:", error);
    alert("LiveKit 연결 실패");
  }
};

export default connectLiveKit;