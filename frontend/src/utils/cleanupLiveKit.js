// src/utils/cleanupLiveKit.js

const cleanupLiveKit = ({ roomInstance, resetLiveKit }) => {
    if (roomInstance) {
        // 1. disconnect
        roomInstance.disconnect();

        // 2. 로컬 트랙 정리
        roomInstance.localParticipant.tracks.forEach((publication) => {
            publication.unpublish();
            publication.track.stop();
        });
    }

    // 3. 참가자 목록 초기화
    resetLiveKit();
}

export default cleanupLiveKit