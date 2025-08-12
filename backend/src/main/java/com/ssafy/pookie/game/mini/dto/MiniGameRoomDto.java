package com.ssafy.pookie.game.mini.dto;

import com.ssafy.pookie.game.room.dto.RoomStateDto;
import com.ssafy.pookie.game.user.dto.UserDto;
import lombok.Data;

import java.util.Map;

@Data
public class MiniGameRoomDto {
    private String roomId;
    private RoomStateDto.GameType gameType = RoomStateDto.GameType.MINIGAME;
    private UserDto user;
    private Integer score;

    public MiniGameRoomDto(UserDto user) {
        this.user = user;
        this.score = 0;
    }

    // 점수 기록
    public void updateScore(Integer score) {
        this.score += score;
    }

    // 점수 달성에 성공했는지
    public Boolean isPassed() {
        // 600 점을 기준으로 통과하였는지
        return this.score >= 600;
    }

    // 게임 오버
    public void gameOver() {
        this.score = 0;
    }

    // 방 정보
    public Map<String, Object> mapMiniGameRoom() {
        return Map.of(
                "roomId", this.roomId,
                "roomMaster", this.user.getUserNickname(),
                "score", this.score
        );
    }
}
