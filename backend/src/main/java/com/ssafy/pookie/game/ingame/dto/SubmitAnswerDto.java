package com.ssafy.pookie.game.ingame.dto;

import com.ssafy.pookie.game.user.dto.UserDto;
import lombok.Data;

@Data
public class SubmitAnswerDto {
    private UserDto user;
    private String roomId;
    private Integer round;
    private Long repIdx;    // 이어그리기에서 그림 그리는 순서
    private Long norIdx;
    private Integer keywordIdx;
    private String inputAnswer;
}
