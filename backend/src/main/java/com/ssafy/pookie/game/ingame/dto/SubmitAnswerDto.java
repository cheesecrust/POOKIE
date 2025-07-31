package com.ssafy.pookie.game.ingame.dto;

import com.ssafy.pookie.game.user.dto.UserDto;
import lombok.Data;

@Data
public class SubmitAnswerDto {
    private UserDto user;
    private String roomId;
    private Integer round;
    // 현재 발화자의 id -> DB 내의 idx
    private Long repId;
    private Long norId;
    private Integer keywordIdx;
    private String inputAnswer;
}
