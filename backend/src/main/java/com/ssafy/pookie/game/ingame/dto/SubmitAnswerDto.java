package com.ssafy.pookie.game.ingame.dto;

import com.ssafy.pookie.game.user.dto.UserDto;
import lombok.Data;

@Data
public class SubmitAnswerDto {
    private UserDto user;
    private String roomId;
    private Integer round;
    private Long repIdx;
    private Integer keywordIdx;
    private String inputAnswer;
}
