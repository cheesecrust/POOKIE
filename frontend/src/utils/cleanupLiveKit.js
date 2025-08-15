// src/utils/cleanupLiveKit.js

const cleanupLiveKit = ({ roomInstance, resetLiveKit }) => {
    if (roomInstance) {
        // 1. 로컬 트랙 정리 (disconnect 전에 먼저 수행)
        if (roomInstance.localParticipant && roomInstance.localParticipant.tracks) {
            roomInstance.localParticipant.tracks.forEach((publication) => {
                try {
                    publication.unpublish();
                    if (publication.track) {
                        publication.track.stop();
                    }
                } catch (error) {
                    console.warn("트랙 정리 중 오류:", error);
                }
            });
        }

        // 2. disconnect
        try {
            roomInstance.disconnect();
        } catch (error) {
            console.warn("LiveKit disconnect 중 오류:", error);
        }
    }

    // 3. 참가자 목록 초기화
    if (resetLiveKit) {
        resetLiveKit();
    }
}

export default cleanupLiveKit